import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import styles from "./legal.module.css";

type LegalPageProps = {
  title: string;
  fileName: string;
};

function renderInline(text: string) {
  const tokenRegex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match = tokenRegex.exec(text);
  while (match) {
    const [fullMatch, linkLabel, linkHref, boldText, codeText] = match;
    const matchIndex = match.index;
    if (matchIndex > cursor) {
      nodes.push(text.slice(cursor, matchIndex));
    }

    if (linkLabel && linkHref) {
      const isExternal = linkHref.startsWith("http://") || linkHref.startsWith("https://");
      nodes.push(
        isExternal ? (
          <a
            key={`${linkHref}:${matchIndex}`}
            href={linkHref}
            target="_blank"
            rel="noreferrer"
            className={styles.legalLink}
          >
            {linkLabel}
          </a>
        ) : (
          <Link key={`${linkHref}:${matchIndex}`} href={linkHref} className={styles.legalLink}>
            {linkLabel}
          </Link>
        ),
      );
    } else if (boldText) {
      nodes.push(<strong key={`bold:${matchIndex}`}>{boldText}</strong>);
    } else if (codeText) {
      nodes.push(<code key={`code:${matchIndex}`}>{codeText}</code>);
    }

    cursor = matchIndex + fullMatch.length;
    match = tokenRegex.exec(text);
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function renderLine(line: string, index: number) {
  if (!line.trim()) return null;
  if (line.startsWith("### ")) {
    return (
      <h3 key={index} className={styles.legalSubHeading}>
        {renderInline(line.slice(4).trim())}
      </h3>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h1 key={index} className={styles.legalTitle}>
        {renderInline(line.slice(2).trim())}
      </h1>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 key={index} className={styles.legalHeading}>
        {renderInline(line.slice(3).trim())}
      </h2>
    );
  }
  if (line.startsWith("- ")) {
    return (
      <ul key={index} className={styles.legalList}>
        <li className={styles.legalListItem}>{renderInline(line.slice(2).trim())}</li>
      </ul>
    );
  }
  return (
    <p key={index} className={styles.legalParagraph}>
      {renderInline(line)}
    </p>
  );
}

function getHeadingLevel(line: string): 1 | 2 | 3 | null {
  const trimmed = line.trim();
  if (trimmed.startsWith("### ")) return 3;
  if (trimmed.startsWith("## ")) return 2;
  if (trimmed.startsWith("# ")) return 1;
  return null;
}

export default async function LegalPage({ title, fileName }: LegalPageProps) {
  const legalDocPath = path.join(process.cwd(), "legal", fileName);
  const fileText = await fs.readFile(legalDocPath, "utf8");
  const lines = fileText.split(/\r?\n/);
  let currentHeadingLevel: 1 | 2 | 3 | null = null;
  const renderedLines = lines.map((line, index) => {
    const headingLevel = getHeadingLevel(line);
    if (headingLevel) {
      currentHeadingLevel = headingLevel;
      return renderLine(line, index);
    }

    if (!line.trim()) return null;

    if (line.startsWith("- ")) {
      return (
        <ul
          key={index}
          className={`${styles.legalList} ${currentHeadingLevel === 3 ? styles.legalListIndented : ""}`}
        >
          <li className={styles.legalListItem}>{renderInline(line.slice(2).trim())}</li>
        </ul>
      );
    }

    return (
      <p
        key={index}
        className={`${styles.legalParagraph} ${currentHeadingLevel === 3 ? styles.legalParagraphIndented : ""}`}
      >
        {renderInline(line)}
      </p>
    );
  });

  return (
    <main className={styles.legalPage}>
      <article className={styles.legalContent} aria-label={title}>
        {renderedLines}
      </article>
    </main>
  );
}

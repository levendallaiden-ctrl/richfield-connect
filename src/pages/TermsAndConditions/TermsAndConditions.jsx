import termsMarkdown from "./terms-and-conditions.md?raw";
import styles from "./TermsAndConditions.module.css";

function formatInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function renderLine(line, index) {
  if (line.startsWith("## ")) {
    return <h2 key={index}>{formatInline(line.slice(3))}</h2>;
  }

  if (line.startsWith("### ")) {
    return <h3 key={index}>{formatInline(line.slice(4))}</h3>;
  }

  if (line.startsWith("- ")) {
    return <li key={index}>{formatInline(line.slice(2))}</li>;
  }

  if (line.startsWith("> ")) {
    return <aside className={styles.notice} key={index}>{formatInline(line.slice(2))}</aside>;
  }

  if (!line.trim()) {
    return <div className={styles.spacer} key={index} aria-hidden="true" />;
  }

  return <p key={index}>{formatInline(line)}</p>;
}

function TermsAndConditions() {
  const lines = termsMarkdown
    .replace(/^# Terms and Conditions\r?\n/, "")
    .split(/\r?\n/);

  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(<ul key={`list-${elements.length}`}>{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith("- ")) {
      listItems.push(renderLine(line, index));
      return;
    }

    flushList();
    elements.push(renderLine(line, index));
  });
  flushList();

  return (
    <article className={styles.terms} aria-labelledby="terms-title">
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Legal information</p>
        <h1 id="terms-title">Terms and Conditions</h1>
        <p>Terms governing use of Richfield Connect and its community features.</p>
      </header>
      <div className={styles.content}>{elements}</div>
    </article>
  );
}

export default TermsAndConditions;

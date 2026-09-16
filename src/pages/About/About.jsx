import styles from "./About.module.css";

const guidelines = [
  "Treat all members of the Richfield community with respect and professionalism.",
  "Do not share content that is discriminatory, harassing, or offensive.",
  "Give credit to original sources when sharing academic work or ideas.",
  "Keep discussions constructive — critique ideas, not people.",
  "Report any content that violates the Richfield Academic Integrity Policy.",
];

function About() {
  return (
    <div className={styles.aboutPage}>
      <section className={styles.pageHero}>
        <h1>About Richfield <em>Connect</em></h1>
        <p>
          Learn about the platform, our mission, and how it supports the
          Richfield student community.
        </p>
      </section>

      <div className={styles.about}>
        <section className={styles.purpose}>
          <h2>Our Mission</h2>
          <p>
            Richfield Connect was built as a response to the growing need for a
            structured, academically focused digital community. Commercial
            social platforms, while widely used, lack the institutional
            alignment and professionalism that a Higher Education environment
            demands.
          </p>
          <p>
            Our mission is simple: to give every Richfield student a trusted
            space to network, collaborate, and share knowledge — built with
            modern web technology and governed by institutional standards.
          </p>
        </section>

        <section className={styles.guidelines}>
          <span className={styles.eyebrow}>What We Stand For</span>
          <h2>Community Guidelines</h2>
          <ol className={styles.guidelinesList}>
            {guidelines.map((rule, index) => (
              <li key={rule}>
                <span className={styles.guidelineNumber}>{index + 1}</span>
                <p>{rule}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.contact}>
          <h2>Contact Information</h2>

          <div className={styles.contactRow}>
            <strong>Richfield Connect Support</strong>
            <p>
              Email:{" "}
              <a href="mailto:402411117@my.richfield.ac.za">
                402411117@my.richfield.ac.za
              </a>
            </p>
          </div>

          <div className={styles.contactRow}>
            <strong>General Enquiries</strong>
            <p>
              Phone: <a href="tel:0861321321">086 132 1321</a>
            </p>
            <p>Campus: Cape Town Campus — Long Street, Cape Town</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;

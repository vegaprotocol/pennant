import clsx from "clsx";
import React from "react";

import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  src: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "High performance",
    src: require("@site/static/img/Auto-Ghost-Only.png").default,
    description: <>Built on the Canvas API and optimized to render at 60fps.</>,
  },
  {
    title: "Technical indicators",
    src: require("@site/static/img/Spinning-Plates.png").default,
    description: (
      <>
        Includes technical indicators including Bollinger bands, EMA, and MACD.
        Developers can add new custom indicators.
      </>
    ),
  },
  {
    title: "Open source and extensible",
    src: require("@site/static/img/Clown-and-Coffee-Ghost.png").default,
    description: <>MIT licensed and accepting community contributions.</>,
  },
];

function Feature({ title, src, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img className={styles.featureSvg} src={src} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

import clsx from "clsx";
import React from "react";

import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "High performance",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: <>Built on the Canvas API and optimized to render at 60fps.</>,
  },
  {
    title: "Technical indicators",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        Includes technical indicators including Bollinger bands, EMA, and MACD.
        Developers can add new custom indicators.
      </>
    ),
  },
  {
    title: "Open source and extensible",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: <>MIT licensed and accepting community contributions.</>,
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
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

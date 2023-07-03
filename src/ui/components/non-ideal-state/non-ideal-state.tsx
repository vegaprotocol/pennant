import "./non-ideal-state.css";

import classNames from "classnames";

import { useDelayShow } from "../../../util/hooks";

export type NonIdealStateProps = {
  delay?: number;
  description?: string;
  title: React.ReactNode;
};

export const NonIdealState = ({
  delay = 1000,
  description,
  title,
}: NonIdealStateProps) => {
  const show = useDelayShow(delay);

  return (
    <div className={classNames("non-ideal-state")}>
      <div className={classNames("content", { hide: !show })}>
        <div className="non-ideal-state-visual"></div>
        <h4 className="heading">{title}</h4>
        {description && <div>{description}</div>}
      </div>
    </div>
  );
};

import "./non-ideal-state.css";

import classNames from "classnames";

import { useDelayShow } from "../../hooks";

export type NonIdealStateProps = {
  description?: string;
  title: string;
};

export const NonIdealState = ({ description, title }: NonIdealStateProps) => {
  const show = useDelayShow(1000);

  return (
    <div className={classNames("non-ideal-state", { hide: !show })}>
      <div className="non-ideal-state-visual"></div>
      <h4 className="heading">{title}</h4>
      {description && <div>{description}</div>}
    </div>
  );
};

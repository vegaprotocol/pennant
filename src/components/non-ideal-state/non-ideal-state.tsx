import "./non-ideal-state.scss";

import { Icon, IconName } from "@blueprintjs/core";

export type NonIdealStateProps = {
  description?: string;
  icon?: IconName;
  title: string;
};

export const NonIdealState = ({
  description,
  icon,
  title,
}: NonIdealStateProps) => {
  return (
    <div className="non-ideal-state">
      {icon && (
        <div className="non-ideal-state-visual">
          <Icon icon={icon} iconSize={60} />
        </div>
      )}
      <h4 className="heading">{title}</h4>
      {description && <div>{description}</div>}
    </div>
  );
};

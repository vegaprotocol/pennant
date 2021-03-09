import "./reset-button.scss";

import { WIDTH, X_AXIS_HEIGHT } from "../../constants";

import { Button } from "@blueprintjs/core";

export type ResetButtonProps = {
  onClick: () => void;
};

export const ResetButton = ({ onClick }: ResetButtonProps) => {
  return (
    <div
      className="reset-button-wrapper"
      style={{ right: `${WIDTH + 8}px`, bottom: `${X_AXIS_HEIGHT + 8}px` }}
    >
      <Button icon="reset" intent="primary" onClick={onClick} />
    </div>
  );
};

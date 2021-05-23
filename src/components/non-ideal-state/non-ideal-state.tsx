import "./non-ideal-state.css";

export type NonIdealStateProps = {
  description?: string;
  title: string;
};

export const NonIdealState = ({ description, title }: NonIdealStateProps) => {
  // TODO: Add icon
  return (
    <div className="non-ideal-state">
      <div className="non-ideal-state-visual"></div>
      <h4 className="heading">{title}</h4>
      {description && <div>{description}</div>}
    </div>
  );
};

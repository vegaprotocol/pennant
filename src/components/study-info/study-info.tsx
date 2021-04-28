import "./study-info.scss";

export type StudyInfoProps = {
  title: string;
  info: { id: string; label: string; value: string }[];
};

export const StudyInfo = ({ title, info }: StudyInfoProps) => {
  return (
    <div className="study-info-wrapper">
      <span className="text-muted">{`${title}: `}</span>
      {info.map((d) => (
        <div key={d.id}>
          <span className="text-muted">{`${d.label} `}</span>
          <span className="monospace-text">{d.value}</span>
        </div>
      ))}
    </div>
  );
};

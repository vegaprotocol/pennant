import styles from "./close-button.module.css";

export type CloseButtonProps = {
  title?: string;
  onClick?: () => void;
};

export const CloseButton = ({ title = "Close", onClick }: CloseButtonProps) => {
  return (
    <a
      className={styles.closeButton}
      role="button"
      title={title}
      aria-label={title}
      onClick={() => {
        onClick?.();
      }}
    >
      <svg className={styles.svgIcon} viewBox="0 0 1024 1024">
        <path d="M150 150a512 512 0 11724 724 512 512 0 01-724-724zm69.3 64.2A418.5 418.5 0 0095.9 512a418.5 418.5 0 00123.4 297.8A418.5 418.5 0 00517 933.2 418.5 418.5 0 00815 809.8 418.5 418.5 0 00938.4 512 418.5 418.5 0 00815 214.2 418.5 418.5 0 00517 90.8a418.5 418.5 0 00-297.8 123.4zM655 304a46 46 0 0165 65L577 512l143 143a46 46 0 11-65 65L512 577 369 720a46 46 0 11-65-65l143-143-143-143a46 46 0 0165-65l143 143 143-143z"></path>
      </svg>
    </a>
  );
};

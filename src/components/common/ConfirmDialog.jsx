import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  cancel = true,
  title = "Megerősítés",
  text = "Biztosan végrehajtod a műveletet?",
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{text}</p>

        <div className="confirm-buttons">
          {cancel &&
          <button className="cancel" onClick={onCancel}>
            Mégsem
          </button>
          }

          <button className="ok" onClick={onConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
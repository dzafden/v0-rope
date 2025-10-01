"use client"

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  // Use direct DOM manipulation to ensure immediate rendering
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#222",
          padding: "20px",
          borderRadius: "8px",
          width: "300px",
          textAlign: "center",
        }}
      >
        <p style={{ marginBottom: "20px" }}>{message}</p>

        <div>
          <button
            style={{
              marginRight: "10px",
              padding: "8px 16px",
              backgroundColor: "#444",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
            }}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            style={{
              padding: "8px 16px",
              backgroundColor: "#8b5cf6",
              border: "none",
              borderRadius: "4px",
              color: "white",
              cursor: "pointer",
            }}
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}

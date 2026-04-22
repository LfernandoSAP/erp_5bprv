import { appShellStyles as styles } from "./appShellStyles";

function SearchInputAction({
  value,
  onChange,
  onSearch,
  placeholder,
  actionLabel = "Pesquisar",
  style = {},
  buttonStyle = {},
}) {
  return (
    <div
      style={{
        ...styles.actionFieldWide,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        minWidth: "min(100%, 320px)",
        ...style,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSearch();
          }
        }}
        placeholder={placeholder}
        style={{
          ...styles.input,
          flex: "1 1 260px",
          minWidth: "min(100%, 220px)",
        }}
      />
      <button
        type="button"
        onClick={onSearch}
        style={{
          ...styles.button,
          ...styles.infoButton,
          padding: "12px 18px",
          minWidth: "112px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...buttonStyle,
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default SearchInputAction;

import { ListItem, ListItemButton, ListItemText } from "@mui/material";

const ACTIVE_ACCENT = "#00e5ff";

const navButtonSx = {
  borderRadius: "14px",
  mx: 1,
  my: 0.25,
  color: "var(--app-text)",
  borderLeft: "3px solid transparent",
  transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(0, 229, 255, 0.05)",
    borderLeftColor: ACTIVE_ACCENT,
  },
  "&.Mui-selected": {
    borderLeftColor: ACTIVE_ACCENT,
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    boxShadow: "inset 0 0 0 1px rgba(0, 229, 255, 0.08)",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "rgba(0, 229, 255, 0.12)",
  },
};

function SidebarMenuItem({ item, activeKey, onNavigate }) {
  const isActive = item.key === activeKey;

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isActive}
        sx={{
          ...navButtonSx,
          ...(isActive
            ? {
                fontWeight: 700,
              }
            : {}),
        }}
        onClick={() => onNavigate(item.key)}
      >
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default SidebarMenuItem;

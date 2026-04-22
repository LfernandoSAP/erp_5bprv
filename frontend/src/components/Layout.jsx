import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import SidebarMenuItem from "./SidebarMenuItem";
import { buildNavigationItemsForViewer } from "../config/navigation";
import { filterNavigationItems, readViewerAccess } from "../utils/authAccess";
import { buildWelcomeMessage } from "../utils/welcomeMessage";

const drawerWidth = 230;

function Layout({
  children,
  activeNavKey,
  onNavigate,
  onLogout,
  themeMode,
  onToggleTheme,
}) {
  const viewerAccess = readViewerAccess();
  const theme = useTheme();
  const isCompactLayout = useMediaQuery(theme.breakpoints.down("lg"));
  const isPhoneLayout = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const welcomeMessage = buildWelcomeMessage(
    viewerAccess.displayName,
    viewerAccess.unitLabel
  );
  const visibleNavigationItems = filterNavigationItems(
    buildNavigationItemsForViewer(viewerAccess),
    viewerAccess
  );
  const handleNavigate = (nextPage) => {
    onNavigate(nextPage);
    if (isCompactLayout) {
      setMobileDrawerOpen(false);
    }
  };
  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ px: 1.5, pt: 2, pb: 2 }}>
        <Box
          sx={{
            px: 1,
            pb: 2,
            borderBottom: "1px solid var(--app-border)",
            mb: 1.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              display: "block",
              color: "var(--app-primary)",
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            ERP 5BPRV
          </Typography>
        </Box>
        <List>
          {visibleNavigationItems.map((item) => (
            <SidebarMenuItem
              key={item.key}
              item={item}
              activeKey={activeNavKey}
              onNavigate={handleNavigate}
            />
          ))}
        </List>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--app-bg)",
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          backgroundColor: "var(--app-appbar-bg)",
          color: "var(--app-appbar-text)",
          boxShadow: "0 12px 30px rgba(2,6,23,0.18)",
        }}
      >
        <Toolbar
          sx={{
            position: "relative",
            minHeight: isPhoneLayout ? "72px" : "64px",
            px: { xs: 1.5, sm: 2 },
            gap: 1,
            alignItems: "center",
          }}
        >
          {isCompactLayout ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 0.5 }}
              aria-label="Abrir menu"
            >
              <MenuIcon />
            </IconButton>
          ) : null}

          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              pr: { xs: 1, sm: 2 },
              maxWidth: isCompactLayout ? "none" : "50%",
            }}
          >
            <Typography
              variant={isPhoneLayout ? "body2" : "body1"}
              noWrap={!isPhoneLayout}
              component="div"
              sx={{
                fontWeight: 600,
                color: "var(--app-appbar-text)",
                lineHeight: 1.3,
              }}
            >
              {welcomeMessage}
            </Typography>
          </Box>

          <Typography
            variant={isPhoneLayout ? "body1" : "h6"}
            noWrap={!isCompactLayout}
            component="div"
            sx={{
              position: isCompactLayout ? "static" : "absolute",
              left: isCompactLayout ? "auto" : "50%",
              transform: isCompactLayout ? "none" : "translateX(-50%)",
              textAlign: "center",
              fontWeight: 700,
              pointerEvents: "none",
              flexShrink: 0,
              maxWidth: isCompactLayout ? "none" : "220px",
            }}
          >
            ERP - 5BPRv
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              ml: "auto",
              flexShrink: 0,
            }}
          >
            <Button
              onClick={onToggleTheme}
              variant="outlined"
              sx={{
                px: { xs: 1.25, sm: 2 },
                minWidth: 0,
                borderRadius: "999px",
                color: "var(--app-appbar-text)",
                borderColor: "rgba(255,255,255,0.22)",
                fontSize: { xs: "0.78rem", sm: "0.9rem" },
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.38)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              {isPhoneLayout
                ? themeMode === "dark"
                  ? "Claro"
                  : "Escuro"
                : themeMode === "dark"
                  ? "Modo claro"
                  : "Modo escuro"}
            </Button>

            <Button
              color="inherit"
              onClick={onLogout}
              sx={{ minWidth: 0, px: { xs: 1, sm: 1.5 } }}
            >
              Sair
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isCompactLayout ? "temporary" : "permanent"}
        open={isCompactLayout ? mobileDrawerOpen : true}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "var(--app-drawer-bg)",
            color: "var(--app-text)",
            borderRight: "1px solid var(--app-border)",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.02)",
          },
          ...(isCompactLayout
            ? {}
            : {
                display: { xs: "none", lg: "block" },
              }),
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: "100%",
          p: { xs: 1, sm: 2, lg: 3 },
          backgroundColor: "var(--app-bg)",
          color: "var(--app-text)",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;

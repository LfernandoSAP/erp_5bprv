import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined";
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CarRentalOutlinedIcon from "@mui/icons-material/CarRentalOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import FlashOnOutlinedIcon from "@mui/icons-material/FlashOnOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import GpsFixedOutlinedIcon from "@mui/icons-material/GpsFixedOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MoveUpOutlinedIcon from "@mui/icons-material/MoveUpOutlined";
import RadioButtonUncheckedOutlinedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SettingsInputAntennaOutlinedIcon from "@mui/icons-material/SettingsInputAntennaOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import ButtonBase from "@mui/material/ButtonBase";

const iconMap = {
  alert: WarningAmberOutlinedIcon,
  archive: Inventory2OutlinedIcon,
  arrowDown: ArrowDownwardOutlinedIcon,
  arrowUp: ArrowUpwardOutlinedIcon,
  baton: ConstructionOutlinedIcon,
  box: Inventory2OutlinedIcon,
  building: BusinessOutlinedIcon,
  calendar: CalendarMonthOutlinedIcon,
  car: CarRentalOutlinedIcon,
  cert: WorkspacePremiumOutlinedIcon,
  chart: ShowChartOutlinedIcon,
  check: CheckCircleOutlineOutlinedIcon,
  circle: RadioButtonUncheckedOutlinedIcon,
  clipboard: ChecklistOutlinedIcon,
  config: SettingsOutlinedIcon,
  doc: DescriptionOutlinedIcon,
  download: DownloadOutlinedIcon,
  exchange: CompareArrowsOutlinedIcon,
  flask: ScienceOutlinedIcon,
  form: EditNoteOutlinedIcon,
  gavel: GavelOutlinedIcon,
  graph: ShowChartOutlinedIcon,
  grid: GridViewOutlinedIcon,
  group: GroupsOutlinedIcon,
  history: HistoryEduOutlinedIcon,
  inventory: Inventory2OutlinedIcon,
  law: GavelOutlinedIcon,
  list: ListAltOutlinedIcon,
  lock: LockOutlinedIcon,
  log: ManageSearchOutlinedIcon,
  map: MapOutlinedIcon,
  megaphone: CampaignOutlinedIcon,
  panel: DashboardCustomizeOutlinedIcon,
  person: BadgeOutlinedIcon,
  purchase: ShoppingCartOutlinedIcon,
  radar: SettingsInputAntennaOutlinedIcon,
  radio: SettingsInputAntennaOutlinedIcon,
  ruler: StraightenOutlinedIcon,
  shield: ShieldOutlinedIcon,
  spray: WaterDropOutlinedIcon,
  straighten: StraightenOutlinedIcon,
  swap: MoveUpOutlinedIcon,
  target: GpsFixedOutlinedIcon,
  tools: ConstructionOutlinedIcon,
  upload: UploadFileOutlinedIcon,
  users: GroupsOutlinedIcon,
  wallet: AccountBalanceWalletOutlinedIcon,
  warehouse: WarehouseOutlinedIcon,
  x: HighlightOffOutlinedIcon,
};

function withAlpha(color, alpha) {
  if (typeof color === "string" && color.startsWith("#") && color.length === 7) {
    return `${color}${alpha}`;
  }

  return color;
}

export const moduleCardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "16px",
  padding: "20px 0",
};

function resolveIcon(icon) {
  if (typeof icon === "function") {
    return icon;
  }

  return iconMap[icon] || AppsOutlinedIcon;
}

function ModuleCard({
  titulo,
  descricao = "",
  
  icone,
  corIcone,
  selected = false,
  onClick,
  title,
  description,
  icon,
  color,
  minHeight = "120px",
}) {
  const resolvedTitle = titulo || title || "";
  const resolvedDescription = descricao || description || "";
  const resolvedColor = color || corIcone || "#25bd1a";
  const Icon = resolveIcon(icone || icon);
  const defaultBorder = withAlpha(resolvedColor, "aa");
  const hoverBorder = resolvedColor;
  const iconBackground = withAlpha(resolvedColor, "2f");
  const accentShadow = `0 0 0 1px ${withAlpha(resolvedColor, "22")}`;
  const leftAccent = withAlpha(resolvedColor, "f0");
  const cardBackground = `linear-gradient(180deg, ${withAlpha(
    resolvedColor,
    "18"
  )} 0%, rgba(31, 51, 71, 0.08) 100%), var(--app-module-card-base)`;
  const hoverBackground = `linear-gradient(180deg, ${withAlpha(
    resolvedColor,
    "24"
  )} 0%, rgba(31, 51, 71, 0.16) 100%), var(--app-module-card-hover)`;
  const hoverShadow = `${accentShadow}, 0 4px 20px rgba(0,0,0,0.3)`;

  return (
    <ButtonBase
      onClick={onClick}
      focusRipple
      sx={{
        background: cardBackground,
        border: `2px solid ${defaultBorder}`,
        borderRadius: "12px",
        padding: "24px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minHeight,
        width: "100%",
        textAlign: "left",
        color: "var(--app-module-card-title)",
        boxShadow: accentShadow,
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "14px",
          bottom: "14px",
          left: 0,
          width: "3px",
          borderRadius: "0 999px 999px 0",
          backgroundColor: leftAccent,
          opacity: selected ? 1 : 0,
          transform: selected ? "scaleY(1)" : "scaleY(0.4)",
          transformOrigin: "center",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        },
        "&:hover": {
          borderColor: hoverBorder,
          transform: "translateY(-2px)",
          boxShadow: hoverShadow,
          background: hoverBackground,
        },
        "&:hover::before": {
          opacity: 1,
          transform: "scaleY(1)",
        },
        "& .MuiTouchRipple-child": {
          backgroundColor: withAlpha(resolvedColor, "55"),
        },
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBackground,
          color: resolvedColor,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--app-module-card-title)",
          lineHeight: 1.3,
        }}
      >
        {resolvedTitle}
      </div>

      {resolvedDescription ? (
        <div
          style={{
            fontSize: "12px",
            color: "var(--app-module-card-description)",
            lineHeight: 1.5,
          }}
        >
          {resolvedDescription}
        </div>
      ) : null}
    </ButtonBase>
  );
}

export default ModuleCard;

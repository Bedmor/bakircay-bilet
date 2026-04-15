import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  CircleHelp,
  CreditCard,
  ExternalLink,
  Heart,
  History,
  Home,
  Landmark,
  Lock,
  Plus,
  PencilLine,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  User,
  UserCog,
  UserCircle,
  Wallet,
} from "lucide-react";

const iconMap = {
  notifications: Bell,
  person: User,
  home: Home,
  explore: Search,
  calendar_month: Calendar,
  favorite: Heart,
  help: CircleHelp,
  arrow_forward: ArrowRight,
  open_in_new: ExternalLink,
  calendar_today: Calendar,
  location_on: Landmark,
  confirmation_number: Ticket,
  stars: Sparkles,
  school: Star,
  local_activity: Ticket,
  search: Search,
  account_circle: UserCircle,
  add: Plus,
  arrow_back: ArrowLeft,
  credit_card: CreditCard,
  account_balance_wallet: Wallet,
  refresh: History,
  lock: Lock,
  security: ShieldCheck,
  history: History,
  chevron_right: ChevronRight,
  photo_camera: Camera,
  settings: Settings,
  share: ArrowRight,
  edit: PencilLine,
  trash: Trash2,
  user_cog: UserCog,
} as const;

type AppIconName = keyof typeof iconMap;

export function AppIcon(props: {
  name: AppIconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = iconMap[props.name];

  return (
    <Icon
      aria-hidden="true"
      className={props.className}
      strokeWidth={props.strokeWidth ?? 2}
    />
  );
}

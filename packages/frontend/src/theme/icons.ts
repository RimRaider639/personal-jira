/**
 * Centralized Icon Library
 *
 * This file provides a consistent icon mapping for the application.
 * Icons are sourced from react-icons (Feather icons - Fi, Heroicons - Hi).
 *
 * Usage:
 *   import { Icons } from '@/theme/icons';
 *   <Icons.Home size={24} />
 *
 * Or import individual icons:
 *   import { HomeIcon, AddIcon } from '@/theme/icons';
 */

// Navigation Icons (Feather)
import {
  FiHome,
  FiGrid,
  FiLayers,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';

// Action Icons (Feather)
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
} from 'react-icons/fi';

// Task Metadata Icons (Feather)
import {
  FiCalendar,
  FiMessageCircle,
  FiPaperclip,
  FiFlag,
} from 'react-icons/fi';

// Filter Icons (Feather)
import {
  FiFilter,
  FiSearch,
  FiXCircle,
} from 'react-icons/fi';

// Board Icons (Feather)
import {
  FiList,
  FiActivity,
} from 'react-icons/fi';

// Color Mode Icons (Feather)
import {
  FiSun,
  FiMoon,
} from 'react-icons/fi';

// Palette Icon (Heroicons)
import { HiOutlineColorSwatch } from 'react-icons/hi';

// Additional Icons (Heroicons)
import {
  HiOutlineViewBoards,
  HiOutlineCollection,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineMenu,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineDotsVertical,
  HiOutlineDotsHorizontal,
  HiOutlineExternalLink,
  HiOutlineDuplicate,
  HiOutlineBookmark,
  HiOutlineTag,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';

// ==================== NAMED EXPORTS ====================

// Navigation Icons
export const HomeIcon = FiHome;
export const BoardsIcon = HiOutlineViewBoards;
export const EpicsIcon = HiOutlineCollection;
export const SettingsIcon = FiSettings;
export const LogoutIcon = FiLogOut;

// Action Icons
export const AddIcon = FiPlus;
export const PlusIcon = FiPlus;
export const EditIcon = FiEdit2;
export const PencilIcon = FiEdit2;
export const DeleteIcon = FiTrash2;
export const TrashIcon = FiTrash2;
export const SaveIcon = FiCheck;
export const CheckIcon = FiCheck;
export const CancelIcon = FiX;
export const CloseIcon = FiX;

// Task Metadata Icons
export const CalendarIcon = FiCalendar;
export const DueDateIcon = FiCalendar;
export const CommentsIcon = FiMessageCircle;
export const ChatIcon = FiMessageCircle;
export const AttachmentsIcon = FiPaperclip;
export const PaperclipIcon = FiPaperclip;
export const PriorityIcon = FiFlag;
export const FlagIcon = FiFlag;

// Filter Icons
export const FilterIcon = FiFilter;
export const FunnelIcon = FiFilter;
export const SearchIcon = FiSearch;
export const MagnifyingGlassIcon = FiSearch;
export const ClearIcon = FiXCircle;
export const XCircleIcon = FiXCircle;

// Board Icons
export const SectionsIcon = FiLayers;
export const LayersIcon = FiLayers;
export const TasksIcon = FiList;
export const ListIcon = FiList;
export const ActivityIcon = FiActivity;
export const ChartIcon = HiOutlineChartBar;

// Color Mode Icons
export const SunIcon = FiSun;
export const MoonIcon = FiMoon;
export const LightModeIcon = FiSun;
export const DarkModeIcon = FiMoon;

// Additional Utility Icons
export const GridIcon = FiGrid;
export const UserIcon = HiOutlineUser;
export const MenuIcon = HiOutlineMenu;
export const ChevronDownIcon = HiOutlineChevronDown;
export const ChevronRightIcon = HiOutlineChevronRight;
export const ChevronLeftIcon = HiOutlineChevronLeft;
export const MoreVerticalIcon = HiOutlineDotsVertical;
export const MoreHorizontalIcon = HiOutlineDotsHorizontal;
export const ExternalLinkIcon = HiOutlineExternalLink;
export const DuplicateIcon = HiOutlineDuplicate;
export const PinIcon = HiOutlineBookmark;
export const BookmarkIcon = HiOutlineBookmark;
export const TagIcon = HiOutlineTag;
export const ClockIcon = HiOutlineClock;
export const RefreshIcon = HiOutlineRefresh;
export const EyeIcon = HiOutlineEye;
export const EyeOffIcon = HiOutlineEyeOff;
export const PaletteIcon = HiOutlineColorSwatch;
export const ColorSwatchIcon = HiOutlineColorSwatch;

// ==================== CENTRALIZED ICONS OBJECT ====================

/**
 * Centralized icons object for consistent usage across the app.
 * Organized by category for easy discovery.
 */
export const Icons = {
  // Navigation
  Home: FiHome,
  Boards: HiOutlineViewBoards,
  Epics: HiOutlineCollection,
  Settings: FiSettings,
  Logout: FiLogOut,

  // Actions
  Add: FiPlus,
  Plus: FiPlus,
  Edit: FiEdit2,
  Pencil: FiEdit2,
  Delete: FiTrash2,
  Trash: FiTrash2,
  Save: FiCheck,
  Check: FiCheck,
  Cancel: FiX,
  Close: FiX,

  // Task Metadata
  Calendar: FiCalendar,
  DueDate: FiCalendar,
  Comments: FiMessageCircle,
  Chat: FiMessageCircle,
  Attachments: FiPaperclip,
  Paperclip: FiPaperclip,
  Priority: FiFlag,
  Flag: FiFlag,

  // Filter
  Filter: FiFilter,
  Funnel: FiFilter,
  Search: FiSearch,
  MagnifyingGlass: FiSearch,
  Clear: FiXCircle,
  XCircle: FiXCircle,

  // Board
  Sections: FiLayers,
  Layers: FiLayers,
  Tasks: FiList,
  List: FiList,
  Activity: FiActivity,
  Chart: HiOutlineChartBar,

  // Color Mode
  Sun: FiSun,
  Moon: FiMoon,
  LightMode: FiSun,
  DarkMode: FiMoon,

  // Utility
  Grid: FiGrid,
  User: HiOutlineUser,
  Menu: HiOutlineMenu,
  ChevronDown: HiOutlineChevronDown,
  ChevronRight: HiOutlineChevronRight,
  ChevronLeft: HiOutlineChevronLeft,
  MoreVertical: HiOutlineDotsVertical,
  MoreHorizontal: HiOutlineDotsHorizontal,
  ExternalLink: HiOutlineExternalLink,
  Duplicate: HiOutlineDuplicate,
  Pin: HiOutlineBookmark,
  Bookmark: HiOutlineBookmark,
  Tag: HiOutlineTag,
  Clock: HiOutlineClock,
  Refresh: HiOutlineRefresh,
  Eye: HiOutlineEye,
  EyeOff: HiOutlineEyeOff,
  Palette: HiOutlineColorSwatch,
  ColorSwatch: HiOutlineColorSwatch,
} as const;

// Type for icon names
export type IconName = keyof typeof Icons;

// Default export
export default Icons;

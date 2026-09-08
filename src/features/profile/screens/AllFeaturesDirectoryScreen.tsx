import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Check,
  Lock,
  UserPlus,
  MessageSquare,
  Clock,
  FileText,
  Upload,
  Layers,
  Cpu,
  Activity,
  ShieldAlert,
  CheckSquare,
  Code,
  Folder,
  Scan,
  FileSearch,
  User,
  Search,
  Send,
  ListFilter,
  Settings,
  Terminal,
  LayoutGrid,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useAuthStore } from '../../../state/useAuthStore';
import { ALL_FEATURES, FeatureDef } from '../../chat/screens/ChatHomeScreen';

export const AllFeaturesDirectoryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { role } = useAuthStore();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handleNavigate = (feat: FeatureDef) => {
    if (feat.perm === 'ops' && role !== 'admin') {
      showToast(`Requires the admin role — you are signed in as ${role}`);
      return;
    }
    navigation.navigate(feat.nav, feat.params);
  };

  const renderIcon = (name: string, color: string, size = 16) => {
    switch (name) {
      case 'lock': return <Lock size={size} color={color} />;
      case 'user-plus': return <UserPlus size={size} color={color} />;
      case 'message-square': return <MessageSquare size={size} color={color} />;
      case 'clock': return <Clock size={size} color={color} />;
      case 'file-text': return <FileText size={size} color={color} />;
      case 'upload': return <Upload size={size} color={color} />;
      case 'layers': return <Layers size={size} color={color} />;
      case 'cpu': return <Cpu size={size} color={color} />;
      case 'activity': return <Activity size={size} color={color} />;
      case 'shield-alert': return <ShieldAlert size={size} color={color} />;
      case 'check-square': return <CheckSquare size={size} color={color} />;
      case 'code': return <Code size={size} color={color} />;
      case 'folder': return <Folder size={size} color={color} />;
      case 'scan': return <Scan size={size} color={color} />;
      case 'file-search': return <FileSearch size={size} color={color} />;
      case 'user': return <User size={size} color={color} />;
      case 'search': return <Search size={size} color={color} />;
      case 'send': return <Send size={size} color={color} />;
      case 'list-filter': return <ListFilter size={size} color={color} />;
      case 'settings': return <Settings size={size} color={color} />;
      case 'terminal': return <Terminal size={size} color={color} />;
      default: return <LayoutGrid size={size} color={color} />;
    }
  };

  const groups: { title: string; items: FeatureDef[] }[] = [];
  ALL_FEATURES.forEach(f => {
    let grp = groups.find(g => g.title === f.g);
    if (!grp) {
      grp = { title: f.g, items: [] };
      groups.push(grp);
    }
    grp.items.push(f);
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <Text style={[styles.appBarTitle, { color: colors.ink }]}>All Features</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.brandSoft }]}>
          <Text style={[styles.countBadgeText, { color: colors.brandDark }]}>23 screens</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollInner}>
        <Text style={[styles.subNote, { color: colors.muted }]}>
          Role-aware navigation map. Tap any screen to open directly. Active role: <Text style={{ fontWeight: '700', color: colors.brandDark }}>{role}</Text>
        </Text>

        {groups.map(grp => (
          <View key={grp.title} style={styles.groupContainer}>
            <Text style={[styles.groupTitle, { color: colors.muted }]}>{grp.title}</Text>
            <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {grp.items.map((feat, idx) => {
                const isLocked = feat.perm === 'ops' && role !== 'admin';
                return (
                  <TouchableOpacity
                    key={feat.id}
                    style={[
                      styles.featRow,
                      idx < grp.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line2 },
                    ]}
                    onPress={() => handleNavigate(feat)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: isLocked ? colors.surface2 : colors.brandSoft },
                      ]}
                    >
                      {renderIcon(feat.iconName, isLocked ? colors.muted : colors.brandDark, 16)}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.featName, { color: colors.ink }]}>{feat.n}</Text>
                      </View>
                      <Text style={[styles.featDesc, { color: colors.muted }]} numberOfLines={1}>
                        {feat.d}
                      </Text>
                    </View>
                    {isLocked ? (
                      <View style={[styles.lockBadge, { backgroundColor: colors.redSoft }]}>
                        <Text style={[styles.lockBadgeText, { color: colors.red }]}>admin</Text>
                      </View>
                    ) : (
                      <ChevronRight size={16} color={colors.muted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Toast */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.navy }]}>
          <Check size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMsg}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  appBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  appBarTitle: { fontSize: 18, fontWeight: '700' },
  countBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  countBadgeText: { fontSize: 11, fontWeight: '700' },
  content: { flex: 1 },
  scrollInner: { padding: 14, paddingBottom: 28 },
  subNote: { fontSize: 12, marginBottom: 12 },
  groupContainer: { marginBottom: 14 },
  groupTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
    marginLeft: 4,
  },
  groupCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featName: { fontSize: 13, fontWeight: '600' },
  featDesc: { fontSize: 11, marginTop: 1 },
  lockBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  lockBadgeText: { fontSize: 9.5, fontWeight: '700' },
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 80,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  toastText: { color: '#ffffff', fontSize: 11.5, flex: 1 },
});

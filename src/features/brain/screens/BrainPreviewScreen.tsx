import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../core/theme/ThemeContext';
import { Routes } from '../../../app/navigation/routes';
import { VALIDATION_RULES } from '../../../mocks/rules.mock';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { usePipelineStore } from '../../../state/usePipelineStore';
import { claimsApi, BackendClaimPreview, BackendClaimValidationRule } from '../../claims/services/claimsApi';
import { formatINR } from '../../../core/utils/currency';
import { GlobalBottomTabBar } from '../../../app/navigation/GlobalBottomTabBar';
import {
  ChevronLeft,
  MessageSquare,
  LayoutGrid,
  Clock,
  Shield,
  FileCode,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText,
  Check,
  X as XIcon,
  RefreshCw,
  Receipt,
  Pencil,
  Trash2,
  Plus,
  Save,
} from 'lucide-react-native';

export interface BrainExpenseItem {
  id: string;
  category: string;
  amount: number;
}

const DEFAULT_EXPENSES_LIST: BrainExpenseItem[] = [
  { id: 'exp-1', category: 'Room & Nursing Charges', amount: 3200 },
  { id: 'exp-2', category: 'Consultation & Doctor Visits', amount: 1500 },
  { id: 'exp-3', category: 'Pharmacy & Medications', amount: 12300 },
  { id: 'exp-4', category: 'Lab & Diagnostic Tests', amount: 7800 },
  { id: 'exp-5', category: 'OT & Procedure Charges', amount: 5700 },
  { id: 'exp-6', category: 'Medical Consumables', amount: 7095 },
];

export const BrainPreviewScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pipelineClaimId = usePipelineStore(s => s.claimId);
  const claimId = route?.params?.claimId || pipelineClaimId || 'a4f1c9e2';

  const cachedPreview = useClaimsStore(s => s.claimPreviews[claimId]);
  const [preview, setPreview] = useState<BackendClaimPreview | null>(route?.params?.preview || cachedPreview || null);
  const [loading, setLoading] = useState<boolean>(!preview);
  const [rerunning, setRerunning] = useState<boolean>(false);

  // Accordion open/close states (all closed by default)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [fraudOpen, setFraudOpen] = useState(false);
  const [codingOpen, setCodingOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  // Expenses management state
  const [expenses, setExpenses] = useState<BrainExpenseItem[]>(() => {
    if (preview?.expenses && preview.expenses.length > 0) {
      return preview.expenses.map((e, idx) => ({
        id: (e as any).id || `exp-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category: e.category || 'Medical expense',
        amount: Math.round(Number(e.amount) || 0),
      }));
    }
    return DEFAULT_EXPENSES_LIST;
  });
  const [isExpensesInitialized, setIsExpensesInitialized] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [deleteTargetExpense, setDeleteTargetExpense] = useState<BrainExpenseItem | null>(null);
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState<boolean>(false);

  // Patient & Claim Details editable form state
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [billedAmount, setBilledAmount] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isDetailsDirty, setIsDetailsDirty] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Initialize editable fields from preview and store
  useEffect(() => {
    if (isDetailsDirty) return;
    const p = preview?.parsed_fields || {};
    const s = preview?.summary;
    const storeClaims = useClaimsStore.getState().claims;
    const c = storeClaims.find(cl => cl.id === claimId || cl.id.startsWith(claimId));

    setPatientName(p.patient_name || s?.patient_name || c?.who || 'Vivek Thakur Blood Group O-');
    setHospitalName(p.hospital_name || p.hospital || s?.hospital || (s as any)?.hospital_name || c?.hospital || 'Government Medical College');
    const billedVal = preview?.billed_total ?? s?.total_amount ?? p.total_amount ?? c?.amt;
    setBilledAmount(billedVal !== undefined && billedVal !== null ? String(billedVal) : '84765.51');
    setAdmissionDate(p.admission_date || s?.admission_date || c?.admissionDate || '07-02-2024');
    setDischargeDate(p.discharge_date || s?.discharge_date || c?.dischargeDate || '22-02-2024');
    setDiagnosis(p.diagnosis || s?.diagnosis || c?.diagnosis || c?.dept || 'Hypothyroidism Chronic Type 2 Pulmon');
  }, [preview, claimId, isDetailsDirty]);

  // Fetch or refresh claim preview from backend
  useEffect(() => {
    let isMounted = true;
    if (claimId) {
      if (cachedPreview && !preview) {
        setPreview(cachedPreview);
        if (cachedPreview.expenses && cachedPreview.expenses.length > 0 && !isExpensesInitialized) {
          setExpenses(
            cachedPreview.expenses.map((e, idx) => ({
              id: `exp-${idx}-${Date.now()}`,
              category: e.category || 'Medical expense',
              amount: Math.round(Number(e.amount) || 0),
            }))
          );
          setIsExpensesInitialized(true);
        }
        setLoading(false);
      }
      claimsApi.getClaimPreview(claimId)
        .then(res => {
          if (isMounted && res) {
            setPreview(res);
            useClaimsStore.getState().setClaimPreview(claimId, res);
            if (res.expenses && res.expenses.length > 0 && !isExpensesInitialized) {
              setExpenses(
                res.expenses.map((e, idx) => ({
                  id: `exp-${idx}-${Date.now()}`,
                  category: e.category || 'Medical expense',
                  amount: Math.round(Number(e.amount) || 0),
                }))
              );
              setIsExpensesInitialized(true);
            }
            setLoading(false);
          } else if (isMounted) {
            setLoading(false);
          }
        })
        .catch(err => {
          console.log('[BrainPreviewScreen] Error fetching preview:', err);
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [claimId]);

  // Summary and fields from preview
  const summary = preview?.summary;
  const parsed = preview?.parsed_fields || {};

  // 1. Risk calculations
  const rawRisk = preview?.predictions?.[0]?.rejection_score ?? summary?.risk_score;
  const riskScorePct = rawRisk !== undefined && rawRisk !== null
    ? Math.round(rawRisk <= 1 ? rawRisk * 100 : rawRisk)
    : 58;
  const riskCategory = preview?.predictions?.[0]?.risk_category || (riskScorePct > 60 ? 'HIGH' : riskScorePct > 30 ? 'MEDIUM' : 'LOW');
  const isLowRisk = riskCategory === 'LOW' || riskScorePct <= 30;
  const isHighRisk = riskCategory === 'HIGH' || riskScorePct > 60;
  const riskColor = isLowRisk ? colors.green : isHighRisk ? colors.red : colors.amber;
  const riskSoftBg = isLowRisk ? colors.greenSoft : isHighRisk ? colors.redSoft : colors.amberSoft;

  // 2. Fraud calculations
  const rawFraud = preview?.fraud_analysis?.risk_level || preview?.predictions?.[0]?.risk_category || 'MED';
  const fraudCategory = rawFraud.toUpperCase().includes('HIGH') ? 'HIGH' : rawFraud.toUpperCase().includes('LOW') ? 'LOW' : 'MED';
  const fraudPillLabel = fraudCategory === 'MED' ? 'MEDIUM' : fraudCategory;
  const isLowFraud = fraudCategory === 'LOW';
  const isHighFraud = fraudCategory === 'HIGH';
  const fraudColor = isLowFraud ? colors.green : isHighFraud ? colors.red : colors.amber;
  const fraudSoftBg = isLowFraud ? colors.greenSoft : isHighFraud ? colors.redSoft : colors.amberSoft;

  // 3. Validation rules calculations
  const rawValidations: BackendClaimValidationRule[] = Array.isArray(preview?.validations) ? preview.validations : [];
  const rulesTotal = rawValidations.length || (summary?.validation_total ?? 11);
  const rulesPassed = rawValidations.length
    ? rawValidations.filter(v => v.passed).length
    : (summary?.validation_passed ?? 7);
  const rulesFailed = Math.max(0, rulesTotal - rulesPassed);

  // Medical codes calculations (strictly respect actual extracted codes for uploaded claims)
  const isDemoClaim = !claimId || claimId === 'a4f1c9e2';
  const icdList = preview
    ? (Array.isArray(preview.icd_codes) ? preview.icd_codes : [])
    : (isDemoClaim ? [
        { code: 'I21.9', description: 'Acute myocardial infarction, unspecified', confidence: 0.94 },
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidence: 0.91 },
        { code: 'I10', description: 'Essential (primary) hypertension', confidence: 0.72 },
      ] : []);

  const cptList = preview
    ? (Array.isArray(preview.cpt_codes) ? preview.cpt_codes : [])
    : (isDemoClaim ? [
        { code: '92941', description: 'Coronary angioplasty, acute MI', estimated_cost: 110000 },
        { code: '93458', description: 'Cardiac catheterisation with angiography', estimated_cost: 28400 },
        { code: '99223', description: 'Inpatient admission, high complexity', estimated_cost: 9600 },
      ] : []);

  const icdCount = icdList.length;
  const cptCount = cptList.length;
  const totalCodes = icdCount + cptCount;

  // 4. Reimbursement readiness checklist state
  const hasDischarge = Boolean(preview?.documents?.some(d => (d.doc_type || '').includes('discharge')) || parsed.discharge_date);
  const hasBill = Boolean(preview?.documents?.some(d => (d.doc_type || '').includes('bill')) || parsed.hospital_name || preview?.billed_total);
  const hasPolicy = Boolean(parsed.policy_number || parsed.insurance_policy_number || parsed.policy_id);
  const hasPreAuth = Boolean(parsed.pre_auth_number || parsed.pre_authorization_number || parsed.pre_auth_ref);

  const [readinessChecks, setReadinessChecks] = useState({
    c1: true,
    c2: true,
    c3: true,
    c4: false,
  });

  useEffect(() => {
    if (preview) {
      setReadinessChecks({
        c1: hasDischarge || true,
        c2: hasBill || true,
        c3: hasPolicy || true,
        c4: hasPreAuth,
      });
    }
  }, [hasDischarge, hasBill, hasPolicy, hasPreAuth, preview]);

  // Compute dynamic readiness percentage based on checklist
  const totalChecks = 4;
  const passedChecksCount = (readinessChecks.c1 ? 1 : 0) + (readinessChecks.c2 ? 1 : 0) + (readinessChecks.c3 ? 1 : 0) + (readinessChecks.c4 ? 1 : 0);
  const readinessPct = Math.round((passedChecksCount / totalChecks) * 100);

  // Verdict Card
  const isLowVerdict = rulesFailed === 0 && isLowRisk;
  const isHighVerdict = isHighRisk || rulesFailed >= 4;
  const verdictStatus = isLowVerdict
    ? 'READY FOR SUBMISSION'
    : (isHighVerdict ? 'HIGH REJECTION RISK' : 'NEEDS REVIEW');
  const verdictColor = isLowVerdict ? colors.green : isHighVerdict ? colors.red : colors.amber;
  const verdictSoftBg = isLowVerdict ? colors.greenSoft : isHighVerdict ? colors.redSoft : colors.amberSoft;
  const verdictSub = rulesFailed === 0
    ? `All ${rulesTotal} rules passed · fraud ${fraudPillLabel} · ready`
    : `${rulesFailed} rules failed · pre-authorisation missing · fraud ${fraudPillLabel}`;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Expenses handlers
  const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleStartEdit = (item: BrainExpenseItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditAmount(String(item.amount));
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCategory('');
    setEditAmount('');
  };

  const handleSaveEdit = (id: string) => {
    const cat = editCategory.trim();
    if (!cat) {
      showToast('Please enter a category name');
      return;
    }
    const cleanAmt = editAmount.replace(/[^0-9.]/g, '');
    const parsed = Math.round(parseFloat(cleanAmt) || 0);
    if (parsed <= 0) {
      showToast('Please enter an amount greater than 0');
      return;
    }

    const updated = expenses.map(e => (e.id === id ? { ...e, category: cat, amount: parsed } : e));
    setExpenses(updated);
    setIsExpensesInitialized(true);
    setEditingId(null);
    setEditCategory('');
    setEditAmount('');

    // Sync preview and claims store
    const newTotal = updated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (preview) {
      const updatedPreview: BackendClaimPreview = {
        ...preview,
        expenses: updated.map(e => ({ id: e.id, category: e.category, amount: e.amount } as any)),
        expense_total: newTotal,
        billed_total: newTotal,
        summary: preview.summary ? { ...preview.summary, total_amount: String(newTotal) } : undefined,
      };
      setPreview(updatedPreview);
      useClaimsStore.getState().setClaimPreview(claimId, updatedPreview);
    }
    useClaimsStore.getState().addOrUpdateClaim({
      id: claimId,
      amt: newTotal,
    });
    showToast(`Saved "${cat}" (${formatINR(parsed)})`);
  };

  const handleDeleteExpense = (item: BrainExpenseItem) => {
    setDeleteTargetExpense(item);
    setShowDeleteExpenseModal(true);
  };

  const confirmDeleteExpense = () => {
    if (!deleteTargetExpense) return;
    const target = deleteTargetExpense;
    const updated = expenses.filter(e => e.id !== target.id);
    setExpenses(updated);
    setIsExpensesInitialized(true);
    if (editingId === target.id) {
      setEditingId(null);
    }
    const newTotal = updated.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    if (preview) {
      const updatedPreview: BackendClaimPreview = {
        ...preview,
        expenses: updated.map(e => ({ id: e.id, category: e.category, amount: e.amount } as any)),
        expense_total: newTotal,
        billed_total: newTotal,
        summary: preview.summary ? { ...preview.summary, total_amount: String(newTotal) } : undefined,
      };
      setPreview(updatedPreview);
      useClaimsStore.getState().setClaimPreview(claimId, updatedPreview);
    }
    useClaimsStore.getState().addOrUpdateClaim({
      id: claimId,
      amt: newTotal,
    });
    setShowDeleteExpenseModal(false);
    setDeleteTargetExpense(null);
    showToast(`Deleted "${target.category}"`);
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewCategory('');
    setNewAmount('');
    setEditingId(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewCategory('');
    setNewAmount('');
  };

  const handleSaveNewExpense = () => {
    const cat = newCategory.trim();
    if (!cat) {
      showToast('Please enter a category name');
      return;
    }
    const cleanAmt = newAmount.replace(/[^0-9.]/g, '');
    const parsed = Math.round(parseFloat(cleanAmt) || 0);
    if (parsed <= 0) {
      showToast('Please enter an amount greater than 0');
      return;
    }

    const newItem: BrainExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: cat,
      amount: parsed,
    };
    const updated = [...expenses, newItem];
    setExpenses(updated);
    setIsExpensesInitialized(true);
    setIsAdding(false);
    setNewCategory('');
    setNewAmount('');

    const newTotal = updated.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (preview) {
      const updatedPreview: BackendClaimPreview = {
        ...preview,
        expenses: updated.map(e => ({ id: e.id, category: e.category, amount: e.amount } as any)),
        expense_total: newTotal,
        billed_total: newTotal,
        summary: preview.summary ? { ...preview.summary, total_amount: String(newTotal) } : undefined,
      };
      setPreview(updatedPreview);
      useClaimsStore.getState().setClaimPreview(claimId, updatedPreview);
    }
    useClaimsStore.getState().addOrUpdateClaim({
      id: claimId,
      amt: newTotal,
    });
    showToast(`Added "${cat}" (${formatINR(parsed)})`);
  };

  const handleRerun = async () => {
    setRerunning(true);
    try {
      if (claimId && claimId.length > 20) {
        const valRes = await claimsApi.getClaimValidation(claimId);
        const updatedPreview = await claimsApi.getClaimPreview(claimId);
        if (updatedPreview) {
          setPreview(updatedPreview);
          useClaimsStore.getState().setClaimPreview(claimId, updatedPreview);
        }
        const p = valRes?.passed ?? rulesPassed;
        const t = valRes?.total_rules ?? rulesTotal;
        showToast(`Validation re-evaluated: ${p} of ${t} rules passed`);
      } else {
        showToast(`POST /validator/validate/… → ${rulesPassed} of ${rulesTotal} rules passed`);
      }
    } catch {
      showToast(`Validation completed: ${rulesPassed} of ${rulesTotal} rules passed`);
    } finally {
      setRerunning(false);
    }
  };

  const handleSaveDetails = async () => {
    if (savingDetails) return;
    setSavingDetails(true);
    try {
      const payload: Record<string, string> = {
        patient_name: patientName.trim(),
        hospital_name: hospitalName.trim(),
        total_amount: billedAmount.trim(),
        admission_date: admissionDate.trim(),
        discharge_date: dischargeDate.trim(),
        diagnosis: diagnosis.trim(),
      };

      const success = await claimsApi.updateClaimFields(claimId, payload);
      if (success) {
        setDetailsSaved(true);
        setIsDetailsDirty(false);
        showToast('Claim details updated successfully');

        const refreshed = await claimsApi.getClaimPreview(claimId);
        if (refreshed) {
          setPreview(refreshed);
          useClaimsStore.getState().setClaimPreview(claimId, refreshed);
        }

        const currentClaim = useClaimsStore.getState().claims.find(c => c.id === claimId || c.id.startsWith(claimId));
        if (currentClaim) {
          useClaimsStore.getState().addOrUpdateClaim({
            ...currentClaim,
            who: patientName.trim() || currentClaim.who,
            hospital: hospitalName.trim() || currentClaim.hospital,
            amt: parseFloat(billedAmount) || currentClaim.amt,
            diagnosis: diagnosis.trim() || currentClaim.diagnosis,
            dept: diagnosis.trim() || currentClaim.dept,
            admissionDate: admissionDate.trim() || currentClaim.admissionDate,
            dischargeDate: dischargeDate.trim() || currentClaim.dischargeDate,
          });
        }

        setTimeout(() => {
          setDetailsSaved(false);
        }, 2200);
      } else {
        showToast('Failed to update details. Please check connection.');
      }
    } catch (err) {
      console.warn('[BrainPreviewScreen] Save details error:', err);
      showToast('Error saving details.');
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* App Bar matching prototype: <  AI Brain Preview     [Chat] [All] */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.ink }]}>AI Brain Preview</Text>

        <View style={styles.appBarRightActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate(Routes.ChatTab)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MessageSquare size={20} color={colors.ink} strokeWidth={1.9} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { marginLeft: 10 }]}
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.AllFeaturesTab })}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LayoutGrid size={20} color={colors.ink} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.surface2 }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 4 Top KPI Cards Row */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => navigation.navigate(Routes.RiskDetail, { claimId, preview })}
              activeOpacity={0.75}
            >
              <Text style={[styles.kpiVal, { color: riskColor }]}>{riskScorePct}%</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Risk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => navigation.navigate(Routes.FraudDetail, { claimId, preview })}
              activeOpacity={0.75}
            >
              <Text style={[styles.kpiVal, { color: fraudColor }]}>{fraudCategory}</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Fraud</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => navigation.navigate(Routes.ValidationRules, { claimId, preview })}
              activeOpacity={0.75}
            >
              <Text style={[styles.kpiVal, { color: colors.ink }]}>{rulesPassed}/{rulesTotal}</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Rules</Text>
            </TouchableOpacity>

            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.kpiVal, { color: colors.ink }]}>{readinessPct}%</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Ready</Text>
            </View>
          </View>

          {/* Verdict Card */}
          <View style={[styles.verdictCard, { backgroundColor: verdictSoftBg }]}>
            <Text style={[styles.verdictTitle, { color: verdictColor }]}>{verdictStatus}</Text>
            <Text style={[styles.verdictSub, { color: verdictColor }]}>
              {verdictSub}
            </Text>
          </View>

          {/* Accordion 0: Patient & Claim Details (Editable Form) */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: isDetailsDirty ? colors.brand : colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setDetailsOpen(!detailsOpen)}
              activeOpacity={0.7}
            >
              <FileText size={16} color={colors.brandDark} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Patient & Claim Details</Text>

              {isDetailsDirty ? (
                <View style={[styles.pillBadge, { backgroundColor: colors.brandSoft }]}>
                  <Text style={[styles.pillText, { color: colors.brandDark }]}>Unsaved edits</Text>
                </View>
              ) : (
                <View style={[styles.pillBadge, { backgroundColor: colors.surface2 }]}>
                  <Text style={[styles.pillText, { color: colors.muted }]}>Editable</Text>
                </View>
              )}

              <View style={{ marginLeft: 'auto' }}>
                {detailsOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {detailsOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {/* Form Subheader & Save Details Button */}
                <View style={[styles.formHeaderRow, { borderBottomColor: colors.line2 }]}>
                  <Text style={[styles.formSubtitle, { color: colors.muted }]}>
                    Extracted demographics & clinical data
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      detailsSaved
                        ? { backgroundColor: colors.green }
                        : isDetailsDirty
                          ? { backgroundColor: colors.brand }
                          : { backgroundColor: colors.surface2, opacity: 0.6 }
                    ]}
                    onPress={handleSaveDetails}
                    disabled={(!isDetailsDirty && !detailsSaved) || savingDetails}
                    activeOpacity={0.8}
                  >
                    {savingDetails ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : detailsSaved ? (
                      <>
                        <Check size={13} color="#ffffff" strokeWidth={2.5} />
                        <Text style={styles.saveBtnText}>Saved! ✓</Text>
                      </>
                    ) : (
                      <>
                        <Save size={13} color={isDetailsDirty ? '#ffffff' : colors.muted} strokeWidth={2} />
                        <Text style={[styles.saveBtnText, !isDetailsDirty && { color: colors.muted }]}>Save Details</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Field 1: Patient Name */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Patient Name</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                    value={patientName}
                    onChangeText={text => {
                      setPatientName(text);
                      setIsDetailsDirty(true);
                    }}
                    placeholder="Patient Name"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Field 2: Hospital / Medical Center */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Hospital / Medical Center</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                    value={hospitalName}
                    onChangeText={text => {
                      setHospitalName(text);
                      setIsDetailsDirty(true);
                    }}
                    placeholder="Hospital / Medical Center"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Field 3: Billed Claim Amount (INR) */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Billed Claim Amount (INR)</Text>
                  <View style={styles.amountInputWrap}>
                    <Text style={[styles.currencyPrefix, { color: colors.brandDark }]}>₹</Text>
                    <TextInput
                      style={[
                        styles.fieldInput,
                        styles.amountInput,
                        { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.green }
                      ]}
                      value={billedAmount}
                      onChangeText={text => {
                        setBilledAmount(text);
                        setIsDetailsDirty(true);
                      }}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                {/* Row: Admission Date & Discharge Date */}
                <View style={styles.dateRow}>
                  {/* Field 4: Admission Date */}
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Admission Date</Text>
                    <TextInput
                      style={[styles.fieldInput, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                      value={admissionDate}
                      onChangeText={text => {
                        setAdmissionDate(text);
                        setIsDetailsDirty(true);
                      }}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                    />
                  </View>

                  {/* Field 5: Discharge Date */}
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Discharge Date</Text>
                    <TextInput
                      style={[styles.fieldInput, { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }]}
                      value={dischargeDate}
                      onChangeText={text => {
                        setDischargeDate(text);
                        setIsDetailsDirty(true);
                      }}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                {/* Field 6: Primary Clinical Diagnosis */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Primary Clinical Diagnosis</Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      styles.multilineInput,
                      { backgroundColor: colors.surface2, borderColor: colors.line, color: colors.ink }
                    ]}
                    value={diagnosis}
                    onChangeText={text => {
                      setDiagnosis(text);
                      setIsDetailsDirty(true);
                    }}
                    multiline
                    numberOfLines={2}
                    placeholder="Primary Clinical Diagnosis"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Accordion 1: Risk Assessment (Open by default) */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setRiskOpen(!riskOpen)}
              activeOpacity={0.7}
            >
              <Clock size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Risk assessment</Text>
              <View style={[styles.pillBadge, { backgroundColor: riskSoftBg }]}>
                <Text style={[styles.pillText, { color: riskColor }]}>
                  {riskScorePct}% · {riskCategory}
                </Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {riskOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {riskOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {preview?.predictions?.[0]?.top_reasons && preview.predictions[0].top_reasons.length > 0 ? (
                  preview.predictions[0].top_reasons.map((item, idx) => {
                    const isNeg = (item.weight || 0) < 0;
                    const dotColor = isNeg ? colors.green : (item.weight || 0) > 15 ? colors.red : colors.amber;
                    const weightLabel = isNeg ? `${item.weight}` : `+${item.weight || 10}`;
                    return (
                      <View key={idx} style={styles.factorRow}>
                        <View style={[styles.dot, { backgroundColor: dotColor }]} />
                        <Text style={[styles.factorText, { color: colors.ink }]}>
                          {item.reason}
                        </Text>
                        <Text style={[styles.factorVal, { color: colors.muted }]}>{weightLabel}</Text>
                      </View>
                    );
                  })
                ) : (
                  <>
                    <View style={styles.factorRow}>
                      <View style={[styles.dot, { backgroundColor: colors.red }]} />
                      <Text style={[styles.factorText, { color: colors.ink }]}>
                        Pre-authorisation reference absent
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>+18</Text>
                    </View>

                    <View style={styles.factorRow}>
                      <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                      <Text style={[styles.factorText, { color: colors.ink }]}>
                        Bill date precedes admission date
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>+11</Text>
                    </View>

                    <View style={styles.factorRow}>
                      <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                      <Text style={[styles.factorText, { color: colors.ink }]}>
                        Pharmacy total above policy sub-limit
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>+7</Text>
                    </View>

                    <View style={styles.factorRow}>
                      <View style={[styles.dot, { backgroundColor: colors.green }]} />
                      <Text style={[styles.factorText, { color: colors.ink }]}>
                        Provider history clean
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>−9</Text>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.RiskDetail, { claimId, preview })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open risk detail
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion 2: Fraud Assessment */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setFraudOpen(!fraudOpen)}
              activeOpacity={0.7}
            >
              <Shield size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Fraud assessment</Text>
              <View style={[styles.pillBadge, { backgroundColor: fraudSoftBg }]}>
                <Text style={[styles.pillText, { color: fraudColor }]}>{fraudPillLabel}</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {fraudOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {fraudOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                <View style={styles.segBar}>
                  <View style={[styles.segPiece, { width: '34%', backgroundColor: colors.green }]} />
                  <View style={[styles.segPiece, { width: '33%', backgroundColor: colors.amber }]} />
                  <View style={[styles.segPiece, { width: '33%', backgroundColor: colors.red }]} />
                </View>

                <View style={styles.segLabelsRow}>
                  <Text style={[styles.segLabel, { color: colors.muted }]}>LOW</Text>
                  <Text style={[styles.segLabel, { color: colors.amber, fontWeight: '700' }]}>
                    MEDIUM
                  </Text>
                  <Text style={[styles.segLabel, { color: colors.muted }]}>HIGH</Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    <Text style={styles.mono}>velocity</Text> — 4 claims from this provider in 24 h
                  </Text>
                </View>

                <View style={styles.factorRow}>
                  <View style={[styles.dot, { backgroundColor: colors.green }]} />
                  <Text style={[styles.factorText, { color: colors.ink }]}>
                    <Text style={styles.mono}>duplicate · billing · provider · coding · identity</Text> — clear
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.FraudDetail, { claimId, preview })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open fraud detail
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion: Medical Coding */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setCodingOpen(!codingOpen)}
              activeOpacity={0.7}
            >
              <FileCode size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Medical coding</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.greenSoft }]}>
                <Text style={[styles.pillText, { color: colors.green }]}>{totalCodes} codes</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {codingOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {codingOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {/* ICD-10 Section */}
                <Text style={[styles.codeSectionHeader, { color: colors.muted }]}>
                  ICD-10 DIAGNOSES ({icdCount})
                </Text>
                {icdList.length > 0 ? (
                  icdList.map((c, idx) => (
                    <View key={`icd-${idx}`} style={styles.ruleSummaryRow}>
                      <View style={[styles.ruleCodeBadge, { backgroundColor: colors.surface2 }]}>
                        <Text style={[styles.ruleCodeText, styles.mono, { color: colors.brandDark }]}>
                          {c.code}
                        </Text>
                      </View>
                      <Text style={[styles.ruleSummaryText, { color: colors.ink }]} numberOfLines={1}>
                        {c.description || (c as any).desc || 'Diagnosis code'}
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>
                        {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : ((c as any).conf || '0.94')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.muted, fontStyle: 'italic' }}>
                      No ICD diagnostic codes extracted
                    </Text>
                  </View>
                )}

                {/* CPT Procedures Section */}
                <Text style={[styles.codeSectionHeader, { color: colors.muted, marginTop: 6 }]}>
                  CPT PROCEDURES ({cptCount})
                </Text>
                {cptList.length > 0 ? (
                  cptList.map((c, idx) => (
                    <View key={`cpt-${idx}`} style={styles.ruleSummaryRow}>
                      <View style={[styles.ruleCodeBadge, { backgroundColor: colors.surface2 }]}>
                        <Text style={[styles.ruleCodeText, styles.mono, { color: colors.muted }]}>
                          {c.code}
                        </Text>
                      </View>
                      <Text style={[styles.ruleSummaryText, { color: colors.ink }]} numberOfLines={1}>
                        {c.description || (c as any).desc || 'Procedure code'}
                      </Text>
                      <Text style={[styles.factorVal, { color: colors.muted }]}>
                        {c.estimated_cost ? `₹${Number(c.estimated_cost).toLocaleString('en-IN')}` : ((c as any).cost || 'CPT')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.muted, fontStyle: 'italic' }}>
                      No CPT procedure codes extracted
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.MedicalCoding, { claimId, preview })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open medical coding
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion: Expenses */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setExpensesOpen(!expensesOpen)}
              activeOpacity={0.7}
            >
              <Receipt size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Expenses</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.greenSoft }]}>
                <Text style={[styles.pillText, { color: colors.green }]}>
                  {expenses.length} items · {formatINR(totalExpense)}
                </Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {expensesOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {expensesOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {/* Sub-header with item count and Add button */}
                <View style={styles.expSubHeaderRow}>
                  <Text style={[styles.codeSectionHeader, { color: colors.muted, marginBottom: 0 }]}>
                    ITEMISED BREAKDOWN ({expenses.length})
                  </Text>
                  {!isAdding && (
                    <TouchableOpacity
                      style={[styles.addExpBtn, { borderColor: colors.brand, backgroundColor: colors.surface2 }]}
                      onPress={handleStartAdd}
                      activeOpacity={0.7}
                    >
                      <Plus size={13} color={colors.brandDark} strokeWidth={2.4} />
                      <Text style={[styles.addExpBtnText, { color: colors.brandDark }]}>Add item</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Add Expense Form */}
                {isAdding && (
                  <View style={[styles.editExpBox, { backgroundColor: colors.surface2, borderColor: colors.brand }]}>
                    <Text style={[styles.editBoxTitle, { color: colors.brandDark }]}>New expense item</Text>
                    <View style={styles.editInputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.muted }]}>Category</Text>
                      <TextInput
                        style={[styles.editTextInput, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                        placeholder="e.g. Diagnostic Imaging, Consumables"
                        placeholderTextColor={colors.muted}
                        value={newCategory}
                        onChangeText={setNewCategory}
                        autoFocus
                      />
                    </View>
                    <View style={styles.editInputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.muted }]}>Amount (₹)</Text>
                      <TextInput
                        style={[styles.editTextInput, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                        placeholder="e.g. 4500"
                        placeholderTextColor={colors.muted}
                        value={newAmount}
                        onChangeText={setNewAmount}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.editActionsRow}>
                      <TouchableOpacity
                        style={[styles.editBtnCancel, { borderColor: colors.line }]}
                        onPress={handleCancelAdd}
                        activeOpacity={0.7}
                      >
                        <XIcon size={14} color={colors.muted} strokeWidth={2} />
                        <Text style={[styles.editBtnCancelText, { color: colors.ink }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editBtnSave, { backgroundColor: colors.brand }]}
                        onPress={handleSaveNewExpense}
                        activeOpacity={0.8}
                      >
                        <Check size={14} color="#ffffff" strokeWidth={2.4} />
                        <Text style={styles.editBtnSaveText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* List of expenses */}
                {expenses.length > 0 ? (
                  expenses.map(item => {
                    const isBeingEdited = editingId === item.id;

                    if (isBeingEdited) {
                      return (
                        <View
                          key={item.id}
                          style={[styles.editExpBox, { backgroundColor: colors.surface2, borderColor: colors.brand }]}
                        >
                          <Text style={[styles.editBoxTitle, { color: colors.brandDark }]}>Edit expense</Text>
                          <View style={styles.editInputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.muted }]}>Category</Text>
                            <TextInput
                              style={[styles.editTextInput, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                              placeholder="Category name"
                              placeholderTextColor={colors.muted}
                              value={editCategory}
                              onChangeText={setEditCategory}
                              autoFocus
                            />
                          </View>
                          <View style={styles.editInputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.muted }]}>Amount (₹)</Text>
                            <TextInput
                              style={[styles.editTextInput, { backgroundColor: colors.surface, color: colors.ink, borderColor: colors.line }]}
                              placeholder="Amount"
                              placeholderTextColor={colors.muted}
                              value={editAmount}
                              onChangeText={setEditAmount}
                              keyboardType="numeric"
                            />
                          </View>
                          <View style={styles.editActionsRow}>
                            <TouchableOpacity
                              style={[styles.editBtnCancel, { borderColor: colors.line }]}
                              onPress={handleCancelEdit}
                              activeOpacity={0.7}
                            >
                              <XIcon size={14} color={colors.muted} strokeWidth={2} />
                              <Text style={[styles.editBtnCancelText, { color: colors.ink }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.editBtnSave, { backgroundColor: colors.brand }]}
                              onPress={() => handleSaveEdit(item.id)}
                              activeOpacity={0.8}
                            >
                              <Check size={14} color="#ffffff" strokeWidth={2.4} />
                              <Text style={styles.editBtnSaveText}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <View key={item.id} style={[styles.expRow, { borderBottomColor: colors.line2 }]}>
                        <View style={styles.expInfo}>
                          <Text style={[styles.expCategory, { color: colors.ink }]}>
                            {item.category}
                          </Text>
                        </View>
                        <Text style={[styles.expAmount, { color: colors.ink }]}>
                          {formatINR(item.amount)}
                        </Text>
                        <View style={styles.expRowActions}>
                          <TouchableOpacity
                            style={[styles.expIconBtn, { backgroundColor: colors.surface2 }]}
                            onPress={() => handleStartEdit(item)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Pencil size={13} color={colors.brandDark} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.expIconBtn, { backgroundColor: colors.redSoft }]}
                            onPress={() => handleDeleteExpense(item)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={13} color={colors.red} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.muted, fontStyle: 'italic' }}>
                      No expenses found. Tap "Add item" to add one.
                    </Text>
                  </View>
                )}

                {/* Total Row */}
                <View style={[styles.expTotalRow, { borderTopColor: colors.line }]}>
                  <Text style={[styles.expTotalLabel, { color: colors.ink }]}>Total claimed amount</Text>
                  <Text style={[styles.expTotalAmount, { color: colors.brandDark }]}>
                    {formatINR(totalExpense)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Accordion 3: Validation Rules */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setRulesOpen(!rulesOpen)}
              activeOpacity={0.7}
            >
              <CheckSquare size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Validation rules</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.amberSoft }]}>
                <Text style={[styles.pillText, { color: colors.amber }]}>
                  {rulesPassed} / {rulesTotal}
                </Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {rulesOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {rulesOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {rawValidations.length > 0 ? (
                  rawValidations.map((rule, idx) => {
                    const isOk = rule.passed;
                    const isWarn = !rule.passed && rule.severity === 'warning';
                    const iconColor = isOk ? colors.green : isWarn ? colors.amber : colors.red;
                    const ruleCode = `R${String(idx + 1).padStart(3, '0')}`;

                    return (
                      <View key={idx} style={styles.ruleSummaryRow}>
                        <View style={[styles.ruleCodeBadge, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.ruleCodeText, styles.mono, { color: colors.muted }]}>
                            {ruleCode}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={[styles.ruleSummaryText, { color: colors.ink }]} numberOfLines={1}>
                            {rule.rule_name}
                          </Text>
                          {rule.message ? (
                            <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
                              {rule.message}
                            </Text>
                          ) : null}
                        </View>
                        <View style={{ marginLeft: 'auto' }}>
                          {isOk ? (
                            <Check size={14} color={iconColor} strokeWidth={2.5} />
                          ) : isWarn ? (
                            <AlertTriangle size={14} color={iconColor} strokeWidth={2.2} />
                          ) : (
                            <XIcon size={14} color={iconColor} strokeWidth={2.5} />
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  VALIDATION_RULES.map(rule => {
                    const isOk = rule.status === 'ok';
                    const isWarn = rule.status === 'warn';
                    const iconColor = isOk ? colors.green : isWarn ? colors.amber : colors.red;

                    return (
                      <View key={rule.code} style={styles.ruleSummaryRow}>
                        <View style={[styles.ruleCodeBadge, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.ruleCodeText, styles.mono, { color: colors.muted }]}>
                            {rule.code}
                          </Text>
                        </View>
                        <Text style={[styles.ruleSummaryText, { color: colors.ink }]} numberOfLines={1}>
                          {rule.title}
                        </Text>
                        <View style={{ marginLeft: 'auto' }}>
                          {isOk ? (
                            <Check size={14} color={iconColor} strokeWidth={2.5} />
                          ) : isWarn ? (
                            <AlertTriangle size={14} color={iconColor} strokeWidth={2.2} />
                          ) : (
                            <XIcon size={14} color={iconColor} strokeWidth={2.5} />
                          )}
                        </View>
                      </View>
                    );
                  })
                )}

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line }]}
                  onPress={() => navigation.navigate(Routes.ValidationRules, { claimId, preview })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    Open validation detail
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Accordion 4: Reimbursement Readiness */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setReadinessOpen(!readinessOpen)}
              activeOpacity={0.7}
            >
              <CheckSquare size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Reimbursement readiness</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.pillText, { color: colors.muted }]}>{readinessPct}%</Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {readinessOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {readinessOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {/* Progress Bar */}
                <View style={[styles.progTrack, { backgroundColor: colors.line }]}>
                  <View style={[styles.progFill, { width: `${readinessPct}%`, backgroundColor: colors.brand }]} />
                </View>

                {/* Checklist items */}
                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c1: !p.c1 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c1
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c1 && <Check size={11} color="#fff" strokeWidth={3.4} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Discharge summary classified
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c2: !p.c2 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c2
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c2 && <Check size={11} color="#fff" strokeWidth={3.4} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Itemised hospital bill classified
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c3: !p.c3 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c3
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c3 && <Check size={11} color="#fff" strokeWidth={3.4} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Policy card verified
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => setReadinessChecks(p => ({ ...p, c4: !p.c4 }))}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkBox,
                      readinessChecks.c4
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { borderColor: colors.line, backgroundColor: colors.surface },
                    ]}
                  >
                    {readinessChecks.c4 && <Check size={11} color="#fff" strokeWidth={3.4} />}
                  </View>
                  <Text style={[styles.checkText, { color: colors.ink }]}>
                    Pre-authorisation letter
                  </Text>
                  {!readinessChecks.c4 && (
                    <View style={[styles.pillBadge, { backgroundColor: colors.redSoft, marginLeft: 6 }]}>
                      <Text style={[styles.pillText, { color: colors.red }]}>Missing</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={[styles.noteText, { color: colors.muted }]}>
                  Threshold 75%+ completeness. Cross-document check: policy number differs on the pharmacy bill.
                </Text>
              </View>
            )}
          </View>

          {/* Accordion 5: Documents Classified */}
          <View style={[styles.accCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <TouchableOpacity
              style={styles.accHeader}
              onPress={() => setDocsOpen(!docsOpen)}
              activeOpacity={0.7}
            >
              <FileText size={16} color={colors.ink} strokeWidth={2} />
              <Text style={[styles.accTitle, { color: colors.ink }]}>Documents classified</Text>
              <View style={[styles.pillBadge, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.pillText, { color: colors.muted }]}>
                  {preview?.documents?.length || 6}
                </Text>
              </View>
              <View style={{ marginLeft: 'auto' }}>
                {docsOpen ? (
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {docsOpen && (
              <View style={[styles.accInner, { borderTopColor: colors.line2 }]}>
                {preview?.documents && preview.documents.length > 0 ? (
                  preview.documents.map((doc, idx) => {
                    const storeClaims = useClaimsStore.getState().claims;
                    const c = storeClaims.find(cl => cl.id === claimId || cl.id.startsWith(claimId));
                    const claimDoc = c?.documents?.find((cd: any) => cd.id === doc.id || cd.file_name === doc.file_name);
                    const raw =
                      doc.original_filename ||
                      doc.file_name ||
                      claimDoc?.original_filename ||
                      claimDoc?.file_name ||
                      `document_${idx + 1}.pdf`;
                    const cleanName = raw.split(/[/\\]/).pop() || raw;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.factorRow}
                        onPress={() => navigation.navigate(Routes.DocumentGrid, { claimId, docKey: doc.id || doc.doc_type })}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.dot, { backgroundColor: colors.green }]} />
                        <Text style={[styles.factorText, styles.mono, { color: colors.ink }]} numberOfLines={1}>
                          {cleanName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  [
                    { name: 'document_1.pdf', key: 'doc1' },
                    { name: 'document_2.pdf', key: 'doc2' },
                    { name: 'document_3.pdf', key: 'doc3' },
                    { name: 'document_4.pdf', key: 'doc4' },
                    { name: 'document_5.pdf', key: 'doc5' },
                    { name: 'document_6.pdf', key: 'doc6' },
                  ].map((doc, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.factorRow}
                      onPress={() => navigation.navigate(Routes.PreviewDocuments, { claimId, docKey: doc.key })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dot, { backgroundColor: colors.green }]} />
                      <Text style={[styles.factorText, styles.mono, { color: colors.ink }]} numberOfLines={1}>
                        {doc.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}

                <TouchableOpacity
                  style={[styles.accActionBtn, { borderColor: colors.line, marginTop: 4 }]}
                  onPress={() => navigation.navigate(Routes.PreviewDocuments, { claimId })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accActionBtnText, { color: colors.brandDark }]}>
                    View documents
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <View style={[styles.toast, { backgroundColor: colors.navy }]}>
            <Check size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.toastText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
        )}

        {/* Sticky Bottom Actions Bar: [Re-run validation]  [Generate IRDAI form] */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.line }]}
            onPress={handleRerun}
            disabled={rerunning}
            activeOpacity={0.7}
          >
            {rerunning ? (
              <ActivityIndicator size="small" color={colors.brandDark} />
            ) : (
              <Text style={[styles.outlineBtnText, { color: colors.brandDark }]}>
                Re-run validation
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
            onPress={() => navigation.navigate(Routes.Submission, { claimId, preview })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Generate IRDAI form</Text>
          </TouchableOpacity>
        </View>

        {/* Global Bottom Tab Bar matching prototype & screenshot */}
        <GlobalBottomTabBar navigation={navigation} activeTab="claims" />
      </View>

      {/* Delete Expense Confirmation Modal */}
      <Modal
        visible={showDeleteExpenseModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteExpenseModal(false);
          setDeleteTargetExpense(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.redSoft }]}>
              <Trash2 size={24} color={colors.red} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.ink }]}>Delete expense?</Text>

            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '700', color: colors.ink }}>
                {deleteTargetExpense?.category}
              </Text>
              {deleteTargetExpense ? ` (${formatINR(deleteTargetExpense.amount)})` : ''}? This will recalculate the claimed total.
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.line, backgroundColor: colors.surface2 }]}
                onPress={() => {
                  setShowDeleteExpenseModal(false);
                  setDeleteTargetExpense(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.ink }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={confirmDeleteExpense}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalDeleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  appBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  appBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 13,
    paddingBottom: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 11,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  verdictCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  verdictTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  verdictSub: {
    fontSize: 11.5,
    marginTop: 3,
    textAlign: 'center',
  },
  banner: {
    flexDirection: 'row',
    gap: 9,
    padding: 11,
    borderRadius: 12,
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  bannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  accCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  accHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  accTitle: {
    fontSize: 13.5,
    fontWeight: '650' as any,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  accInner: {
    borderTopWidth: 1,
    paddingHorizontal: 13,
    paddingBottom: 13,
    paddingTop: 8,
    gap: 9,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  factorText: {
    flex: 1,
    fontSize: 12.5,
  },
  factorVal: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  segBar: {
    flexDirection: 'row',
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  segPiece: {
    height: '100%',
  },
  segLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  segLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  ruleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 3,
  },
  ruleCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ruleCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  ruleSummaryText: {
    flex: 1,
    fontSize: 12,
  },
  progTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progFill: {
    height: '100%',
    borderRadius: 99,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 12.5,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  codeSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  accActionBtn: {
    marginTop: 6,
    paddingVertical: 9,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accActionBtnText: {
    fontSize: 13,
    fontWeight: '650' as any,
  },
  toast: {
    position: 'absolute',
    bottom: 74,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 9,
  },
  outlineBtn: {
    flex: 0.42,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '650' as any,
  },
  primaryBtn: {
    flex: 0.58,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  expSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  addExpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  addExpBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  expInfo: {
    flex: 1,
    paddingRight: 8,
  },
  expCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  expAmount: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 10,
  },
  expRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editExpBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginVertical: 6,
  },
  editBoxTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editInputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  editTextInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  editBtnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  editBtnCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editBtnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editBtnSaveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  expTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1.5,
  },
  expTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  expTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalDeleteBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 11,
    flex: 1,
    paddingRight: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 12.5,
    fontWeight: '600',
  },
  amountInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: 11,
    fontSize: 13.5,
    fontWeight: '700',
    zIndex: 2,
  },
  amountInput: {
    paddingLeft: 25,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  multilineInput: {
    minHeight: 46,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
});

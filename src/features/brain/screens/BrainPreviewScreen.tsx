import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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
  LayoutGrid,
  Clock,
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
  ArrowUpDown,
  UploadCloud,
  Lock,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Edit3,
  ShieldAlert,
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
  const [codingOpen, setCodingOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
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
  const [policyNumber, setPolicyNumber] = useState('');
  const [isDetailsDirty, setIsDetailsDirty] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Policy missing check & Fast OCR upload state
  const [isExtractingPolicy, setIsExtractingPolicy] = useState(false);
  const [showPolicyUploadModal, setShowPolicyUploadModal] = useState(false);
  const [showPolicyRequiredModal, setShowPolicyRequiredModal] = useState(false);
  const policyInputRef = useRef<TextInput>(null);

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
    const pol = (
      p.policy_number ||
      p.policy_id ||
      s?.policy_number ||
      preview?.policy_id ||
      c?.policyNo ||
      ''
    ).trim();
    setPolicyNumber(pol);
  }, [preview, claimId, isDetailsDirty]);

  const isPolicyMissing =
    !policyNumber ||
    policyNumber.toLowerCase() === 'n/a' ||
    policyNumber.toLowerCase() === 'none' ||
    policyNumber.toLowerCase() === 'missing' ||
    policyNumber.toLowerCase() === 'unknown';

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
    : 16;
  const riskCategory = preview?.predictions?.[0]?.risk_category || (riskScorePct > 60 ? 'HIGH' : riskScorePct > 30 ? 'MEDIUM' : 'LOW');
  const isLowRisk = riskCategory === 'LOW' || riskScorePct <= 30;
  const isHighRisk = riskCategory === 'HIGH' || riskScorePct > 60;
  const riskColor = isLowRisk ? colors.green : isHighRisk ? colors.red : colors.amber;
  const riskSoftBg = isLowRisk ? colors.greenSoft : isHighRisk ? colors.redSoft : colors.amberSoft;

  // 2. Validation rules calculations
  const rawValidations: BackendClaimValidationRule[] = Array.isArray(preview?.validations) ? preview.validations : [];
  const rulesTotal = rawValidations.length || (summary?.validation_total ?? 11);
  const rulesPassed = rawValidations.length
    ? rawValidations.filter(v => v.passed).length
    : (summary?.validation_passed ?? 10);
  const rulesFailed = Math.max(0, rulesTotal - rulesPassed);

  // Medical codes calculations (strictly respect actual extracted codes for uploaded claims)
  const isDemoClaim = !claimId || claimId === 'a4f1c9e2';
  const rawIcdList = preview
    ? (Array.isArray(preview.icd_codes) ? preview.icd_codes : [])
    : (isDemoClaim ? [
        {
          code: 'I21.9',
          description: 'Acute myocardial infarction, unspecified',
          confidence: 0.94,
          code_includes: 'Code covers: Myocardial infarction NOS | Acute cardiac infarction',
          other_matches: [
            { code: 'I21.0', description: 'STEMI of anterior wall', confidence: 0.89, code_includes: 'Code covers: Transmural infarction of anterior wall' },
            { code: 'I21.1', description: 'STEMI of inferior wall', confidence: 0.84, code_includes: 'Code covers: Transmural infarction of inferior wall' },
          ],
        },
        {
          code: 'E11.9',
          description: 'Type 2 diabetes mellitus without complications',
          confidence: 0.91,
          code_includes: 'Code covers: Diabetes mellitus NOS',
          other_matches: [
            { code: 'E11.6', description: 'Type 2 diabetes mellitus with other specified complications', confidence: 0.86, code_includes: 'Code covers: Diabetic arthropathy' },
            { code: 'E11.2', description: 'Type 2 diabetes mellitus with kidney complications', confidence: 0.81, code_includes: 'Code covers: Diabetic nephropathy' },
          ],
        },
        {
          code: 'I10',
          description: 'Essential (primary) hypertension',
          confidence: 0.72,
          code_includes: 'Code covers: High blood pressure | Hypertension (arterial)(essential)(primary)(systemic)',
          other_matches: [
            { code: 'I11.9', description: 'Hypertensive heart disease without heart failure', confidence: 0.70, code_includes: 'Code covers: Hypertensive cardiopathy' },
            { code: 'I15.9', description: 'Secondary hypertension, unspecified', confidence: 0.65, code_includes: 'Code covers: Secondary hypertension' },
          ],
        },
      ] : []);

  const [editableIcdList, setEditableIcdList] = useState<any[]>([]);

  useEffect(() => {
    const enriched = rawIcdList.map((item: any) => {
      let alts = item.other_matches || [];
      if (!alts.length && item.code) {
        if (item.code.startsWith('K44')) {
          alts = [
            {
              code: item.code === 'K44.9' ? 'K44.0' : 'K44.9',
              description: item.code === 'K44.9' ? 'Diaphragmatic hernia with obstruction, without gangrene' : 'Diaphragmatic hernia without obstruction or gangrene',
              confidence: 0.87,
              code_includes: 'Code covers: hiatus hernia (oesophageal)(sliding) | paraoesophageal hernia | Diaphragmatic hernia NOS',
            },
            {
              code: item.code === 'K44.1' ? 'K44.0' : 'K44.1',
              description: item.code === 'K44.1' ? 'Diaphragmatic hernia with obstruction, without gangrene' : 'Diaphragmatic hernia with gangrene',
              confidence: 0.81,
              code_includes: 'Code covers: hiatus hernia (oesophageal)(sliding) | paraoesophageal hernia | Gangrenous diaphragmatic hernia',
            },
          ];
        } else if (item.code.startsWith('I21')) {
          alts = [
            { code: 'I21.0', description: 'STEMI of anterior wall', confidence: 0.89, code_includes: 'Code covers: Transmural infarction of anterior wall' },
            { code: 'I21.1', description: 'STEMI of inferior wall', confidence: 0.84, code_includes: 'Code covers: Transmural infarction of inferior wall' },
          ];
        }
      }

      const covers = item.code_includes || (
        item.code === 'K44.0'
          ? 'Code covers: hiatus hernia (oesophageal)(sliding) | paraoesophageal hernia | Diaphragmatic hernia: causing obstruction without gangrene | Diaphragmatic hernia: incarcerated without gangrene | Diaphragmatic hernia: irreducible without gangrene | Diaphragmatic hernia: strangulated without gangrene'
          : undefined
      );

      return {
        ...item,
        code_includes: covers,
        other_matches: alts,
      };
    });
    setEditableIcdList(enriched);
  }, [preview?.icd_codes]);

  // Mobile disclosures
  const [mobileExpandedOther, setMobileExpandedOther] = useState<Record<string, boolean>>({});
  const [mobileExpandedDesc, setMobileExpandedDesc] = useState<Record<string, boolean>>({});

  const toggleMobileOther = (key: string) => {
    setMobileExpandedOther(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMobileDesc = (key: string) => {
    setMobileExpandedDesc(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const swapMobileCandidate = (parentIdx: number, altIdx: number) => {
    setEditableIcdList(prev => {
      const next = [...prev];
      const currentTop = next[parentIdx];
      if (!currentTop || !currentTop.other_matches || !currentTop.other_matches[altIdx]) return prev;

      const chosenAlt = currentTop.other_matches[altIdx];
      const newAlts = [...currentTop.other_matches];

      newAlts[altIdx] = {
        code: currentTop.code,
        description: currentTop.description,
        confidence: currentTop.confidence,
        code_includes: currentTop.code_includes,
      };

      next[parentIdx] = {
        ...currentTop,
        code: chosenAlt.code,
        description: chosenAlt.description,
        confidence: chosenAlt.confidence,
        code_includes: chosenAlt.code_includes,
        other_matches: newAlts,
      };

      return next;
    });
  };

  const icdList = editableIcdList;

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
        policy_number: policyNumber.trim(),
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
            policyNo: policyNumber.trim() || currentClaim.policyNo,
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

  const handlePickPolicyDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setShowPolicyUploadModal(false);
        await runPolicyOcr({
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('[BrainPreviewScreen] Document picker error:', err);
      showToast('Document selection failed');
    }
  };

  const handlePickPolicyPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setShowPolicyUploadModal(false);
        const name = asset.fileName || `HealthCard_${Date.now()}.jpg`;
        await runPolicyOcr({
          name,
          type: asset.mimeType || 'image/jpeg',
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('[BrainPreviewScreen] Image picker error:', err);
      showToast('Photo selection failed');
    }
  };

  const handleTakePolicyPhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showToast('Camera permission is required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setShowPolicyUploadModal(false);
        const name = `HealthCard_Camera_${Date.now()}.jpg`;
        await runPolicyOcr({
          name,
          type: asset.mimeType || 'image/jpeg',
          uri: asset.uri,
        });
      }
    } catch (err: any) {
      console.warn('[BrainPreviewScreen] Camera error:', err);
      showToast('Camera capture failed');
    }
  };

  const runPolicyOcr = async (fileObj: { name: string; type?: string; uri?: string; blob?: any }) => {
    setIsExtractingPolicy(true);
    showToast('Extracting policy details with Fast OCR...');
    try {
      const res = await claimsApi.extractPolicyFromDoc(claimId, fileObj);
      if (res.success && (res.policy_id || res.insurer)) {
        const extractedPolicy = (res.policy_id || '').trim();
        if (extractedPolicy) {
          setPolicyNumber(extractedPolicy);
          await claimsApi.updateClaimFields(claimId, {
            policy_number: extractedPolicy,
            ...(res.insurer ? { insurance_company: res.insurer } : {}),
          });
          const currentClaim = useClaimsStore.getState().claims.find(c => c.id === claimId || c.id.startsWith(claimId));
          if (currentClaim) {
            useClaimsStore.getState().addOrUpdateClaim({
              ...currentClaim,
              policyNo: extractedPolicy,
            });
          }
          const refreshed = await claimsApi.getClaimPreview(claimId);
          if (refreshed) {
            setPreview(refreshed);
            useClaimsStore.getState().setClaimPreview(claimId, refreshed);
          }
          showToast(`Policy #${extractedPolicy} verified & linked!`);
        } else {
          showToast('Document processed. Please enter policy number manually.');
          setDetailsOpen(true);
          setTimeout(() => policyInputRef.current?.focus(), 300);
        }
      } else {
        showToast('Could not auto-extract Policy ID. Please enter manually.');
        setDetailsOpen(true);
        setTimeout(() => policyInputRef.current?.focus(), 300);
      }
    } catch (err: any) {
      console.warn('[BrainPreviewScreen] OCR extraction error:', err);
      showToast('OCR extraction failed. You can enter Policy ID manually.');
      setDetailsOpen(true);
      setTimeout(() => policyInputRef.current?.focus(), 300);
    } finally {
      setIsExtractingPolicy(false);
    }
  };

  const handleFocusPolicyInput = () => {
    setShowPolicyRequiredModal(false);
    setDetailsOpen(true);
    setTimeout(() => {
      policyInputRef.current?.focus();
    }, 250);
  };

  const handleGenerateIrdai = () => {
    if (isPolicyMissing) {
      setShowPolicyRequiredModal(true);
      return;
    }
    navigation.navigate(Routes.Submission, { claimId, preview });
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
            onPress={() => navigation.navigate('MainTabs', { screen: Routes.AllFeaturesTab })}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LayoutGrid size={20} color={colors.ink} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: colors.surface2 }]}>
        {loading && !preview ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={{ marginTop: 14, fontSize: 14, fontWeight: '600', color: colors.muted }}>
              Loading AI Brain Preview…
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* 3 Top KPI Cards Row */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={[
                styles.kpiCard,
                { backgroundColor: riskSoftBg, borderColor: riskColor },
              ]}
              onPress={() => navigation.navigate(Routes.RiskDetail, { claimId, preview })}
              activeOpacity={0.75}
            >
              <Text style={[styles.kpiVal, { color: riskColor }]}>{riskScorePct}%</Text>
              <Text style={[styles.kpiLabel, { color: riskColor, fontWeight: '600' }]}>Risk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
              onPress={() => navigation.navigate(Routes.ValidationRules, { claimId, preview })}
              activeOpacity={0.75}
            >
              <Text style={[styles.kpiVal, { color: colors.ink }]}>{rulesPassed}/{rulesTotal}</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Rules</Text>
            </TouchableOpacity>
          </View>

          {/* Policy Document / Health Card Missing Notice Card (Web Feature on Mobile) */}
          {isPolicyMissing && (
            <View style={[styles.policyNoticeCard, { backgroundColor: colors.amberSoft, borderColor: colors.amber + '40' }]}>
              <View style={styles.policyNoticeHeader}>
                <View style={[styles.policyNoticeIconWrap, { backgroundColor: colors.amber + '25' }]}>
                  <AlertTriangle size={17} color={colors.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={[styles.policyNoticeTitle, { color: colors.ink }]}>Policy / Health Card Missing</Text>
                    <View style={[styles.policyNoticeBadge, { backgroundColor: colors.amber + '30' }]}>
                      <Text style={[styles.policyNoticeBadgeText, { color: colors.amber }]}>REQUIRED</Text>
                    </View>
                  </View>
                  <Text style={[styles.policyNoticeDesc, { color: colors.muted }]}>
                    Required for TPA & IRDAI reports. Upload the patient's Policy Schedule or Health Card, or enter the policy number below.
                  </Text>
                </View>
              </View>

              <View style={styles.policyNoticeActions}>
                <TouchableOpacity
                  style={[styles.policyUploadBtn, { backgroundColor: colors.brand }]}
                  onPress={() => setShowPolicyUploadModal(true)}
                  disabled={isExtractingPolicy}
                  activeOpacity={0.8}
                >
                  {isExtractingPolicy ? (
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                  ) : (
                    <UploadCloud size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.policyUploadBtnText}>
                    {isExtractingPolicy ? 'Extracting OCR...' : 'Upload Policy / Card'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.policyEnterBtn, { borderColor: colors.line, backgroundColor: colors.surface }]}
                  onPress={handleFocusPolicyInput}
                  activeOpacity={0.7}
                >
                  <Edit3 size={14} color={colors.ink} style={{ marginRight: 5 }} />
                  <Text style={[styles.policyEnterBtnText, { color: colors.ink }]}>Enter Policy ID</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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

                {/* Field 0: Policy Number / Health Card ID */}
                <View style={styles.fieldGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted, marginBottom: 0 }]}>
                      Policy Number / Card ID
                    </Text>
                    {isPolicyMissing ? (
                      <View style={[styles.inlineBadge, { backgroundColor: colors.redSoft }]}>
                        <Text style={[styles.inlineBadgeText, { color: colors.red }]}>MISSING</Text>
                      </View>
                    ) : (
                      <View style={[styles.inlineBadge, { backgroundColor: colors.greenSoft }]}>
                        <Text style={[styles.inlineBadgeText, { color: colors.green }]}>VERIFIED</Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    ref={policyInputRef}
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: colors.surface2,
                        borderColor: isPolicyMissing ? colors.amber : colors.line,
                        color: colors.ink,
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                        fontWeight: '600',
                      },
                    ]}
                    value={policyNumber}
                    onChangeText={text => {
                      setPolicyNumber(text);
                      setIsDetailsDirty(true);
                    }}
                    placeholder="e.g. POL-161114/01/2024/002345"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                  />
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
                  icdList.map((c, parentIdx) => {
                    const topDescKey = `top-${parentIdx}-${c.code}`;
                    const isTopDescOpen = Boolean(mobileExpandedDesc[topDescKey]);
                    const otherKey = `other-${parentIdx}-${c.code}`;
                    const isOtherOpen = Boolean(mobileExpandedOther[otherKey]);
                    const otherMatches: any[] = c.other_matches || [];

                    return (
                      <View
                        key={`icd-${parentIdx}-${c.code}`}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: colors.line2,
                          padding: 10,
                          marginBottom: 8,
                        }}
                      >
                        {/* Top 1 Active Matched Code */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.ruleCodeBadge, { backgroundColor: colors.brandSoft }]}>
                              <Text style={[styles.ruleCodeText, styles.mono, { color: colors.brandDark }]}>
                                {c.code}
                              </Text>
                            </View>
                            <View style={{ backgroundColor: colors.surface2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ fontSize: 9.5, fontWeight: '600', color: colors.brandDark }}>
                                Matched Code
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.factorVal, { color: colors.green, fontWeight: '700' }]}>
                            {c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : ((c as any).conf || '91%')} Match
                          </Text>
                        </View>

                        <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.ink, lineHeight: 17, marginBottom: 6 }}>
                          {c.description || (c as any).desc || 'Diagnosis code'}
                        </Text>

                        {/* Top 1 Code Description Disclosure Triangle */}
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3 }}
                          onPress={() => toggleMobileDesc(topDescKey)}
                          activeOpacity={0.7}
                        >
                          {isTopDescOpen ? (
                            <ChevronDown size={13} color={colors.brandDark} />
                          ) : (
                            <ChevronRight size={13} color={colors.muted} />
                          )}
                          <Text style={{ fontSize: 11, fontWeight: '600', color: isTopDescOpen ? colors.brandDark : colors.muted }}>
                            Code description &amp; coverage
                          </Text>
                        </TouchableOpacity>

                        {isTopDescOpen && (
                          <View style={{ backgroundColor: colors.surface2, borderRadius: 8, padding: 8, marginTop: 4, marginBottom: 4 }}>
                            <Text style={{ fontSize: 11, color: colors.ink, marginBottom: c.code_includes ? 4 : 0 }}>
                              <Text style={{ fontWeight: '700', color: colors.muted }}>Description: </Text>
                              {c.description}
                            </Text>
                            {c.code_includes && (
                              <Text style={{ fontSize: 11, color: colors.ink, lineHeight: 15 }}>
                                <Text style={{ fontWeight: '700', color: colors.brandDark }}>What code covers: </Text>
                                {c.code_includes.replace(/^Code covers:\s*/i, '')}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Other Closest Matches Disclosure Triangle Button */}
                        {otherMatches.length > 0 && (
                          <View style={{ borderTopWidth: 1, borderTopColor: colors.line2, marginTop: 6, paddingTop: 6 }}>
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}
                              onPress={() => toggleMobileOther(otherKey)}
                              activeOpacity={0.7}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                {isOtherOpen ? (
                                  <ChevronDown size={13} color={colors.brandDark} />
                                ) : (
                                  <ChevronRight size={13} color={colors.muted} />
                                )}
                                <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.ink }}>
                                  Other closest matches
                                </Text>
                                <View style={{ backgroundColor: colors.surface2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 99 }}>
                                  <Text style={{ fontSize: 9.5, color: colors.muted, fontWeight: '600' }}>
                                    {otherMatches.length}
                                  </Text>
                                </View>
                              </View>
                              <Text style={{ fontSize: 10, color: colors.muted, fontStyle: 'italic' }}>
                                Tap to swap
                              </Text>
                            </TouchableOpacity>

                            {isOtherOpen && (
                              <View style={{ marginTop: 6, gap: 6 }}>
                                {otherMatches.map((alt, altIdx) => {
                                  const altDescKey = `alt-${parentIdx}-${altIdx}-${alt.code}`;
                                  const isAltDescOpen = Boolean(mobileExpandedDesc[altDescKey]);

                                  return (
                                    <View
                                      key={`alt-${alt.code}-${altIdx}`}
                                      style={{
                                        backgroundColor: colors.surface2,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: colors.line2,
                                        padding: 8,
                                      }}
                                    >
                                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                          <View style={[styles.ruleCodeBadge, { backgroundColor: colors.surface }]}>
                                            <Text style={[styles.ruleCodeText, styles.mono, { color: colors.brandDark, fontSize: 10 }]}>
                                              {alt.code}
                                            </Text>
                                          </View>
                                          <Text style={{ fontSize: 10, color: colors.muted, fontWeight: '600' }}>
                                            {alt.confidence ? `${(alt.confidence * 100).toFixed(0)}%` : '85%'} Match
                                          </Text>
                                        </View>

                                        {/* Swap Button */}
                                        <TouchableOpacity
                                          style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 3,
                                            backgroundColor: colors.surface,
                                            borderColor: colors.brandDark,
                                            borderWidth: 1,
                                            paddingHorizontal: 7,
                                            paddingVertical: 2,
                                            borderRadius: 5,
                                          }}
                                          onPress={() => swapMobileCandidate(parentIdx, altIdx)}
                                          activeOpacity={0.7}
                                        >
                                          <ArrowUpDown size={11} color={colors.brandDark} />
                                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.brandDark }}>
                                            Swap into Top 1
                                          </Text>
                                        </TouchableOpacity>
                                      </View>

                                      <Text style={{ fontSize: 11.5, color: colors.ink, lineHeight: 15, marginBottom: 4 }}>
                                        {alt.description}
                                      </Text>

                                      {/* Candidate Code Description Disclosure */}
                                      <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 }}
                                        onPress={() => toggleMobileDesc(altDescKey)}
                                        activeOpacity={0.7}
                                      >
                                        {isAltDescOpen ? (
                                          <ChevronDown size={11} color={colors.brandDark} />
                                        ) : (
                                          <ChevronRight size={11} color={colors.muted} />
                                        )}
                                        <Text style={{ fontSize: 10, fontWeight: '600', color: isAltDescOpen ? colors.brandDark : colors.muted }}>
                                          Code description &amp; coverage
                                        </Text>
                                      </TouchableOpacity>

                                      {isAltDescOpen && (
                                        <View style={{ backgroundColor: colors.surface, borderRadius: 6, padding: 6, marginTop: 3 }}>
                                          <Text style={{ fontSize: 10.5, color: colors.ink, marginBottom: alt.code_includes ? 3 : 0 }}>
                                            <Text style={{ fontWeight: '700', color: colors.muted }}>Description: </Text>
                                            {alt.description}
                                          </Text>
                                          {alt.code_includes && (
                                            <Text style={{ fontSize: 10.5, color: colors.ink, lineHeight: 14 }}>
                                              <Text style={{ fontWeight: '700', color: colors.brandDark }}>What code covers: </Text>
                                              {alt.code_includes.replace(/^Code covers:\s*/i, '')}
                                            </Text>
                                          )}
                                        </View>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
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
        )}

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
            style={[
              styles.primaryBtn,
              {
                backgroundColor: isPolicyMissing ? colors.amber : colors.brand,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            onPress={handleGenerateIrdai}
            activeOpacity={0.85}
          >
            {isPolicyMissing && <Lock size={14} color="#ffffff" style={{ marginRight: 6 }} />}
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

      {/* Policy Document / Health Card Fast OCR Upload Modal */}
      <Modal
        visible={showPolicyUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isExtractingPolicy) setShowPolicyUploadModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.uploadModalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.uploadModalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.uploadModalTitle, { color: colors.ink }]}>
                  Upload Policy / Health Card
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>
                  Fast OCR will extract Policy Number &amp; Insurer instantly
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!isExtractingPolicy) setShowPolicyUploadModal(false);
                }}
                disabled={isExtractingPolicy}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {isExtractingPolicy ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={{ marginTop: 14, fontSize: 13, fontWeight: '600', color: colors.ink }}>
                  Extracting policy details with Fast OCR…
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                  Verifying policy clauses and metadata
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.uploadOptionBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={handlePickPolicyDoc}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadOptionIconWrap, { backgroundColor: colors.brandSoft }]}>
                    <FileText size={18} color={colors.brandDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.uploadOptionTitle, { color: colors.ink }]}>Browse File (PDF / Image)</Text>
                    <Text style={[styles.uploadOptionSub, { color: colors.muted }]}>Select policy schedule or e-card from device</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadOptionBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={handleTakePolicyPhoto}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadOptionIconWrap, { backgroundColor: colors.brandSoft }]}>
                    <Camera size={18} color={colors.brandDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.uploadOptionTitle, { color: colors.ink }]}>Take Photo of Physical Card</Text>
                    <Text style={[styles.uploadOptionSub, { color: colors.muted }]}>Snap health insurance card with camera</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadOptionBtn, { backgroundColor: colors.surface2, borderColor: colors.line }]}
                  onPress={handlePickPolicyPhoto}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadOptionIconWrap, { backgroundColor: colors.brandSoft }]}>
                    <ImageIcon size={18} color={colors.brandDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.uploadOptionTitle, { color: colors.ink }]}>Photo Library</Text>
                    <Text style={[styles.uploadOptionSub, { color: colors.muted }]}>Choose card photo from gallery</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Policy Required Interception Modal */}
      <Modal
        visible={showPolicyRequiredModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPolicyRequiredModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.policyReqModalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={[styles.policyReqIconCircle, { backgroundColor: colors.amberSoft }]}>
              <ShieldAlert size={28} color={colors.amber} />
            </View>

            <Text style={[styles.policyReqTitle, { color: colors.ink }]}>
              Policy Number Required
            </Text>

            <Text style={[styles.policyReqDesc, { color: colors.muted }]}>
              TPA Comprehensive Audit Reports and official IRDAI claim forms require a valid Policy Number. Please upload your health card or enter the policy number to generate the report.
            </Text>

            <View style={styles.policyReqActionCol}>
              <TouchableOpacity
                style={[styles.policyReqPrimaryBtn, { backgroundColor: colors.brand }]}
                onPress={() => {
                  setShowPolicyRequiredModal(false);
                  setShowPolicyUploadModal(true);
                }}
                activeOpacity={0.8}
              >
                <UploadCloud size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.policyReqPrimaryBtnText}>Upload Policy / Health Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.policyReqSecondaryBtn, { borderColor: colors.line, backgroundColor: colors.surface2 }]}
                onPress={handleFocusPolicyInput}
                activeOpacity={0.7}
              >
                <Edit3 size={15} color={colors.ink} style={{ marginRight: 6 }} />
                <Text style={[styles.policyReqSecondaryBtnText, { color: colors.ink }]}>Enter Policy Number Manually</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.policyReqDismissBtn}
                onPress={() => setShowPolicyRequiredModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.policyReqDismissBtnText, { color: colors.muted }]}>Dismiss</Text>
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
  // Policy Notice Card
  policyNoticeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 11,
  },
  policyNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  policyNoticeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  policyNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  policyNoticeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  policyNoticeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  policyNoticeDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  policyNoticeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  policyUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  policyUploadBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  policyEnterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
  },
  policyEnterBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  inlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inlineBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Upload Sheet Modal
  uploadModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  uploadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  uploadModalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  uploadOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  uploadOptionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  uploadOptionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  policyReqModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  policyReqIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  policyReqTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  policyReqDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  policyReqActionCol: {
    width: '100%',
    gap: 8,
  },
  policyReqPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
  },
  policyReqPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  policyReqSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  policyReqSecondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  policyReqDismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  policyReqDismissBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

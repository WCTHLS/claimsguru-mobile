import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  FileText,
  ShieldCheck,
  FileCheck,
  Stethoscope,
  FileSearch,
  ExternalLink,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Eye,
} from 'lucide-react-native';
import { useTheme } from '../../../core/theme/ThemeContext';
import { useClaimsStore } from '../../../state/useClaimsStore';
import { ClaimItem, INITIAL_CLAIMS } from '../../../mocks/claims.mock';
import { formatINR } from '../../../core/utils/currency';
import { Routes } from '../../../app/navigation/routes';

export interface ClaimDocSummary {
  key: string;
  name: string;
  file: string;
  size: string;
  badge: string;
  conf?: number;
  tags?: string[];
  docType?: string;
}

const formatDocTitle = (d: any, idx: number): string => {
  if (d.display_title) return d.display_title;
  if (d.doc_type) {
    return d.doc_type
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  if (d.original_filename || d.file_name) {
    const fn = (d.original_filename || d.file_name)
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ');
    return fn.replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  if (d.name) return d.name;
  return `Document ${idx + 1}`;
};

const formatDocBadge = (d: any): string => {
  const type = (d.doc_type || d.badge || '').toLowerCase();
  if (type.includes('bill') || type.includes('invoice')) return 'BILL';
  if (type.includes('discharge')) return 'DISCHARGE';
  if (type.includes('lab') || type.includes('pathology')) return 'LAB';
  if (type.includes('scan') || type.includes('radiology') || type.includes('mri') || type.includes('ct')) return 'SCAN';
  if (type.includes('rx') || type.includes('pharmacy')) return 'RX';
  if (type.includes('form') || type.includes('claim')) return 'FORM';
  if (type.includes('id') || type.includes('aadhaar')) return 'ID';
  if (type.includes('policy')) return 'POLICY';
  const ext = (d.file_name || d.file || '').split('.').pop()?.toUpperCase();
  if (ext && ext.length <= 4 && ext !== 'PDF') return ext;
  return 'PDF';
};

export const getClaimDocumentsList = (claim: ClaimItem, preview?: any): ClaimDocSummary[] => {
  const backendDocs = preview?.documents || claim?.documents;
  if (Array.isArray(backendDocs) && backendDocs.length > 0) {
    return backendDocs.map((d: any, idx: number) => {
      const docTypeKey = d.doc_type || d.key || (d.id ? `doc_${d.id}` : `doc_${idx}`);
      const rawName = formatDocTitle(d, idx);
      const rawFile = d.file_name || d.original_filename || d.file || `${rawName}.pdf`;
      const badge = formatDocBadge(d);
      return {
        key: `${docTypeKey}_${idx}`,
        name: rawName,
        file: rawFile,
        size: d.size || (d.page_count ? `${d.page_count} pg · PDF` : '1.5 MB'),
        badge: badge.length > 9 ? badge.slice(0, 9) : badge,
        conf: typeof d.conf === 'number' ? d.conf : 0.98,
        tags: Array.isArray(d.tags) ? d.tags : ['verified'],
        docType: docTypeKey,
      };
    });
  }

  const patientName = claim.who || 'Patient';
  const hospital = claim.hospital || 'Hospital';

  if (claim.id.startsWith('7b03') || claim.dept === 'Orthopaedics') {
    return [
      {
        key: 'discharge_summary',
        name: `Discharge Summary - ${patientName}`,
        file: 'Discharge_Summary_Signed.pdf',
        size: '1.6 MB',
        badge: 'PDF',
        conf: 0.99,
        tags: ['discharge_summary', 'verified'],
      },
      {
        key: 'hospital_bill',
        name: `Final Tax Invoice - ${hospital}`,
        file: 'Apollo_Final_Bill_Itemized.pdf',
        size: '1.4 MB',
        badge: 'BILL',
        conf: 0.98,
        tags: ['hospital_bill', 'gstin_verified'],
      },
      {
        key: 'scan_report',
        name: 'MRI Knee Joint (Right) Diagnostic Report',
        file: 'MRI_Knee_Joint_Report.pdf',
        size: '4.2 MB',
        badge: 'SCAN',
        conf: 0.95,
        tags: ['radiology', 'mri'],
      },
      {
        key: 'insurance_form',
        name: 'Cashless Pre-Authorisation Request Form',
        file: 'Cashless_PreAuth_Request.pdf',
        size: '1.9 MB',
        badge: 'FORM',
        conf: 0.99,
        tags: ['irdai_standard', 'verified'],
      },
      {
        key: 'pharmacy_bill',
        name: 'Pharmacy & Surgical Implants Tax Invoice',
        file: 'Pharmacy_Implants_Breakup.pdf',
        size: '820 KB',
        badge: 'RX',
        conf: 0.94,
        tags: ['pharmacy_bill'],
      },
    ];
  }

  if (claim.id.startsWith('2e6f') || claim.dept === 'Nephrology') {
    return [
      {
        key: 'discharge_summary',
        name: `Clinical Inpatient Summary - ${patientName}`,
        file: 'Clinical_Inpatient_Summary.pdf',
        size: '1.5 MB',
        badge: 'PDF',
        conf: 0.97,
        tags: ['inpatient_summary'],
      },
      {
        key: 'hospital_bill',
        name: `Fortis Healthcare Interim & Final Bill`,
        file: 'Fortis_Interim_Final_Bill.pdf',
        size: '2.1 MB',
        badge: 'BILL',
        conf: 0.96,
        tags: ['hospital_bill'],
      },
      {
        key: 'lab_report',
        name: 'Ultrasound KUB & Renal Function Profile',
        file: 'Ultrasound_KUB_Blood_Panel.pdf',
        size: '1.1 MB',
        badge: 'LAB',
        conf: 0.97,
        tags: ['pathology', 'lab_report'],
      },
      {
        key: 'insurance_form',
        name: 'Reimbursement Claim Form Part-B',
        file: 'Mediclaim_Part_B_Signed.pdf',
        size: '1.8 MB',
        badge: 'FORM',
        conf: 0.98,
        tags: ['insurance_form'],
      },
    ];
  }

  if (claim.id.startsWith('9c25') || claim.dept === 'Oncology') {
    return [
      {
        key: 'lab_report',
        name: 'Histopathology & Biopsy Clinical Panel',
        file: 'Biopsy_Histopathology_Report.pdf',
        size: '2.8 MB',
        badge: 'LAB',
        conf: 0.92,
        tags: ['biopsy', 'oncology'],
      },
      {
        key: 'discharge_summary',
        name: 'Chemotherapy Cycle Protocol & Day-care Notes',
        file: 'DayCare_Chemo_Protocol.pdf',
        size: '1.3 MB',
        badge: 'PDF',
        conf: 0.94,
        tags: ['chemo_protocol'],
      },
      {
        key: 'hospital_bill',
        name: `Max Super Specialty Inpatient Bill`,
        file: 'Max_Healthcare_IPD_Invoice.pdf',
        size: '1.7 MB',
        badge: 'BILL',
        conf: 0.93,
        tags: ['hospital_bill'],
      },
      {
        key: 'policy_card',
        name: 'National Health Insurance Policy Schedule',
        file: 'Policy_Schedule_National.pdf',
        size: '720 KB',
        badge: 'POLICY',
        conf: 0.99,
        tags: ['policy_card'],
      },
    ];
  }

  // Default rich 7-document set for primary claim
  return [
    {
      key: 'discharge_summary',
      name: `Discharge Summary - ${patientName}`,
      file: 'Discharge_Summary_Signed.pdf',
      size: '1.8 MB',
      badge: 'PDF',
      conf: 0.99,
      tags: ['discharge_summary', 'verified'],
    },
    {
      key: 'insurance_form',
      name: 'Reimbursement Claim Form (National Insurance)',
      file: 'National_Insurance_Claim_Form.pdf',
      size: '2.4 MB',
      badge: 'FORM',
      conf: 0.99,
      tags: ['insurance_form', 'irdai_standard'],
    },
    {
      key: 'hospital_bill',
      name: `Hospital Bill - ${hospital}`,
      file: 'Hospital_Final_Tax_Invoice.pdf',
      size: '1.2 MB',
      badge: 'BILL',
      conf: 0.98,
      tags: ['hospital_bill', 'gstin_verified'],
    },
    {
      key: 'lab_report',
      name: 'Lab Investigation Report (Biochemistry & Blood)',
      file: 'Clinical_Pathology_Report.pdf',
      size: '890 KB',
      badge: 'LAB',
      conf: 0.96,
      tags: ['lab_report', 'pathology'],
    },
    {
      key: 'pharmacy_bill',
      name: 'Pharmacy Itemized Bill & Consumables',
      file: 'Pharmacy_Tax_Invoice.pdf',
      size: '760 KB',
      badge: 'RX',
      conf: 0.92,
      tags: ['pharmacy_bill'],
    },
    {
      key: 'scan_report',
      name: 'Radiology / Chest CT Scan Report',
      file: 'Chest_High_Res_CT_Scan.pdf',
      size: '5.6 MB',
      badge: 'SCAN',
      conf: 0.91,
      tags: ['scan_report', 'radiology'],
    },
    {
      key: 'policy_card',
      name: 'Health Insurance Policy Schedule',
      file: 'National_Health_Policy_Schedule.pdf',
      size: '620 KB',
      badge: 'POLICY',
      conf: 0.99,
      tags: ['policy_card'],
    },
  ];
};

const getDocIcon = (key?: string) => {
  if (!key || typeof key !== 'string') return FileText;
  const lower = key.toLowerCase();
  if (lower.includes('discharge')) return ShieldCheck || FileText;
  if (lower.includes('bill') || lower.includes('invoice') || lower.includes('receipt')) return FileCheck || FileText;
  if (lower.includes('lab') || lower.includes('scan') || lower.includes('diagnostic')) return Stethoscope || FileText;
  return FileSearch || FileText;
};

export const DocumentGridScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const { claims, loadClaims, refreshing, claimPreviews } = useClaimsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'complete' | 'running' | 'submitted' | 'FAILED'>('All');

  // Load claims on mount
  useEffect(() => {
    loadClaims();
  }, []);

  // Merge loaded claims with fallback INITIAL_CLAIMS so all claims have documents
  const allClaims = useMemo<ClaimItem[]>(() => {
    if (claims && claims.length > 0) {
      return claims;
    }
    return INITIAL_CLAIMS;
  }, [claims]);

  // Compute total documents across all claims
  const claimDocMap = useMemo(() => {
    const map = new Map<string, ClaimDocSummary[]>();
    allClaims.forEach(c => {
      const preview = claimPreviews[c.id];
      map.set(c.id, getClaimDocumentsList(c, preview));
    });
    return map;
  }, [allClaims, claimPreviews]);

  const totalDocsCount = useMemo(() => {
    let count = 0;
    claimDocMap.forEach(docs => {
      count += docs.length;
    });
    return count;
  }, [claimDocMap]);

  // Filter claims based on status filter and search query
  const filteredClaims = useMemo(() => {
    return allClaims.filter(claim => {
      // Status filter
      if (statusFilter !== 'All' && claim.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const docs = claimDocMap.get(claim.id) || [];
        const matchName = (claim.who || '').toLowerCase().includes(q);
        const matchId = claim.id.toLowerCase().includes(q);
        const matchHospital = (claim.hospital || '').toLowerCase().includes(q);
        const matchDept = (claim.dept || '').toLowerCase().includes(q);
        const matchDiagnosis = (claim.diagnosis || '').toLowerCase().includes(q);
        const matchDocs = docs.some(d => d.name.toLowerCase().includes(q) || d.file.toLowerCase().includes(q));

        return matchName || matchId || matchHospital || matchDept || matchDiagnosis || matchDocs;
      }

      return true;
    });
  }, [allClaims, statusFilter, searchQuery, claimDocMap]);

  const handleOpenPreview = (claimId: string, docKey?: string) => {
    navigation.navigate(Routes.PreviewDocuments, { claimId, docKey });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return { label: 'Complete', bg: '#ecfdf5', text: '#059669', icon: CheckCircle2 };
      case 'submitted':
        return { label: 'Submitted', bg: '#eff6ff', text: '#2563eb', icon: Layers };
      case 'running':
        return { label: 'Processing', bg: '#fffbeb', text: '#d97706', icon: Clock };
      case 'FAILED':
        return { label: 'Failed', bg: '#fef2f2', text: '#dc2626', icon: AlertCircle };
      default:
        return { label: status, bg: '#f1f5f9', text: '#475569', icon: Clock };
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Top App Bar: <  Documents  (left-aligned) */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.appBarTitleContainer}>
          <Text style={[styles.appBarTitle, { color: colors.ink }]} numberOfLines={1}>
            Documents
          </Text>
          <Text style={[styles.appBarSubtitle, { color: colors.muted }]}>
            {totalDocsCount} files attached across {allClaims.length} claims
          </Text>
        </View>
        <View style={styles.headerRightBadge}>
          <View style={[styles.docCountPill, { backgroundColor: colors.brandSoft }]}>
            <FileText size={13} color={colors.brandDark} strokeWidth={2.2} />
            <Text style={[styles.docCountText, { color: colors.brandDark }]}>{totalDocsCount}</Text>
          </View>
        </View>
      </View>

      {/* Search and Filters Header */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          <Search size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.ink }]}
            placeholder="Search by patient, claim ID, hospital, document..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {[
            { key: 'All', label: `All Claims (${allClaims.length})` },
            { key: 'complete', label: 'Complete' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'running', label: 'Processing' },
            { key: 'FAILED', label: 'Failed' },
          ].map(tab => {
            const isSel = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterPill,
                  isSel
                    ? { backgroundColor: colors.brand, borderColor: colors.brand }
                    : { backgroundColor: colors.surface2, borderColor: colors.line },
                ]}
                onPress={() => setStatusFilter(tab.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSel ? '#ffffff' : colors.muted, fontWeight: isSel ? '700' : '500' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Claims-wise Documents List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadClaims(true)}
            tintColor={colors.brand}
          />
        }
      >
        {filteredClaims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileSearch size={44} color={colors.muted} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>No claims or documents found</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              {searchQuery ? `No matches for "${searchQuery}". Try a different keyword.` : 'No claims currently available.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: colors.brand }]}
                onPress={() => setSearchQuery('')}
              >
                <Text style={[styles.clearBtnText, { color: colors.brandDark }]}>Clear Search</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          filteredClaims.map((claim, claimIdx) => {
            const safeClaimId = claim.id || `claim_${claimIdx}`;
            const docs = claimDocMap.get(safeClaimId) || claimDocMap.get(claim.id) || [];
            const statusConfig = getStatusBadge(claim.status || 'complete');
            const StatusIcon = statusConfig?.icon || CheckCircle2;
            const statusLabel = statusConfig?.label || 'Complete';
            const statusBg = statusConfig?.bg || '#ecfdf5';
            const statusText = statusConfig?.text || '#059669';
            const shortId = safeClaimId.length > 12 ? `${safeClaimId.slice(0, 8)}...` : safeClaimId;

            return (
              <View
                key={`claim_card_${safeClaimId}_${claimIdx}`}
                style={[
                  styles.claimCard,
                  { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                {/* 1. Claim Header - Tap to preview */}
                <TouchableOpacity
                  style={styles.claimHeader}
                  onPress={() => handleOpenPreview(safeClaimId)}
                  activeOpacity={0.75}
                >
                  <View style={styles.claimHeaderTop}>
                    <View style={styles.patientInfo}>
                      <View style={[styles.avatarCircle, { backgroundColor: colors.brandSoft }]}>
                        <Text style={[styles.avatarText, { color: colors.brandDark }]}>
                          {(claim.who || 'PT').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.patientNameRow}>
                          <Text style={[styles.patientName, { color: colors.ink }]} numberOfLines={1}>
                            {claim.who || 'Unknown Patient'}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <StatusIcon size={12} color={statusText} strokeWidth={2.4} />
                            <Text style={[styles.statusBadgeText, { color: statusText }]}>
                              {statusLabel}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.claimIdText, styles.mono, { color: colors.muted }]}>
                          ID: #{shortId}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Hospital & Department details */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Building2 size={13} color={colors.muted} />
                      <Text style={[styles.metaText, { color: colors.muted }]} numberOfLines={1}>
                        {claim.hospital || 'Hospital'} {claim.dept ? `· ${claim.dept}` : ''}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <CreditCard size={13} color={colors.brandDark} />
                      <Text style={[styles.metaAmountText, { color: colors.ink }]}>
                        {formatINR(claim.amt || 0)}
                      </Text>
                    </View>
                  </View>

                  {/* Diagnosis & Dates if available */}
                  {(claim.diagnosis || claim.admissionDate) && (
                    <View style={styles.subMetaRow}>
                      {claim.diagnosis ? (
                        <Text style={[styles.diagnosisText, { color: colors.muted }]} numberOfLines={1}>
                          <Text style={{ fontWeight: '600', color: colors.ink }}>Dx: </Text>
                          {claim.diagnosis}
                        </Text>
                      ) : null}
                      {claim.admissionDate ? (
                        <View style={styles.dateBadge}>
                          <Calendar size={11} color={colors.muted} />
                          <Text style={[styles.dateBadgeText, { color: colors.muted }]}>
                            {claim.admissionDate}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>

                {/* 2. Documents Section Header */}
                <View style={[styles.docsSectionHeader, { borderTopColor: colors.line, borderBottomColor: colors.line }]}>
                  <View style={styles.docsTitleRow}>
                    <FileText size={14} color={colors.brandDark} strokeWidth={2.2} />
                    <Text style={[styles.docsSectionTitle, { color: colors.ink }]}>
                      UPLOADED DOCUMENTS ({docs.length})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.previewAllBtn, { backgroundColor: colors.brandSoft }]}
                    onPress={() => handleOpenPreview(safeClaimId)}
                    activeOpacity={0.7}
                  >
                    <Eye size={13} color={colors.brandDark} strokeWidth={2.2} />
                    <Text style={[styles.previewAllBtnText, { color: colors.brandDark }]}>
                      Preview All
                    </Text>
                    <ChevronRight size={13} color={colors.brandDark} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>

                {/* 3. Document Items List - Each document is clickable to preview that specific document */}
                <View style={styles.docList}>
                  {docs.map((doc, docIdx) => {
                    const DocIcon = getDocIcon(doc.key);
                    const isLast = docIdx === docs.length - 1;
                    const docItemKey = `doc_${safeClaimId}_${doc.key || doc.name || docIdx}_${docIdx}`;

                    return (
                      <TouchableOpacity
                        key={docItemKey}
                        style={[
                          styles.docRow,
                          !isLast && { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                        onPress={() => handleOpenPreview(safeClaimId, doc.key)}
                        activeOpacity={0.65}
                      >
                        <View style={[styles.docIconWrap, { backgroundColor: colors.surface2 }]}>
                          <DocIcon size={16} color={colors.brandDark} strokeWidth={2} />
                        </View>

                        <View style={styles.docInfo}>
                          <Text style={[styles.docNameText, { color: colors.ink }]} numberOfLines={1}>
                            {doc.name}
                          </Text>
                          <View style={styles.docBadgesRow}>
                            <View style={[styles.pillBadge, { backgroundColor: colors.brandSoft }]}>
                              <Text style={[styles.pillBadgeText, { color: colors.brandDark }]}>
                                {doc.badge}
                              </Text>
                            </View>
                            <Text style={[styles.docSizeText, { color: colors.muted }]}>
                              {doc.size}
                            </Text>
                            {doc.conf ? (
                              <Text style={[styles.docConfText, { color: '#059669' }]}>
                                {Math.round(doc.conf * 100)}% OCR
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.docActionWrap}>
                          <View style={[styles.openPreviewChip, { backgroundColor: colors.surface2 }]}>
                            <Text style={[styles.openPreviewChipText, { color: colors.muted }]}>
                              View
                            </Text>
                            <ChevronRight size={13} color={colors.muted} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  appBarTitleContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  appBarSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
    textAlign: 'left',
  },
  headerRightBadge: {
    paddingRight: 4,
  },
  docCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  docCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchFilterContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    gap: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  claimCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  claimHeader: {
    padding: 14,
    gap: 8,
  },
  claimHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  claimIdText: {
    fontSize: 11,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
  },
  metaAmountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  diagnosisText: {
    fontSize: 12,
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 11,
  },
  docsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  previewAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  docList: {
    paddingHorizontal: 12,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  docIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    gap: 3,
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '600',
  },
  docBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  docSizeText: {
    fontSize: 11,
  },
  docConfText: {
    fontSize: 11,
    fontWeight: '600',
  },
  docActionWrap: {
    justifyContent: 'center',
  },
  openPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openPreviewChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
export default DocumentGridScreen;

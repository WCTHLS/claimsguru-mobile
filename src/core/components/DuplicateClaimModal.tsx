import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AlertCircle, Eye, RefreshCw, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export interface DuplicateClaimModalProps {
  visible: boolean;
  onClose: () => void;
  onViewExisting: () => void;
  onUploadAnyway: () => void;
  isReprocessing?: boolean;
}

export const DuplicateClaimModal: React.FC<DuplicateClaimModalProps> = ({
  visible,
  onClose,
  onViewExisting,
  onUploadAnyway,
  isReprocessing = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? '#78350f' : '#fde68a',
            },
          ]}
        >
          {/* Close button in top-right */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            disabled={isReprocessing}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.muted} />
          </TouchableOpacity>

          {/* Centered Amber Alert Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark ? '#451a03' : '#fffbeb',
                borderColor: isDark ? '#92400e' : '#fde68a',
              },
            ]}
          >
            <AlertCircle size={30} color={isDark ? '#f59e0b' : '#d97706'} strokeWidth={2.2} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.ink }]}>
            Duplicate Claim Detected
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.muted }]}>
            This exact document set has already been uploaded and processed into an existing claim audit report.
            {'\n\n'}
            Would you like to view the existing completed claim, or re-upload and process fresh?
          </Text>

          {/* Note Box */}
          <View
            style={[
              styles.noteBox,
              {
                backgroundColor: isDark ? '#422006' : '#fffbeb',
                borderColor: isDark ? '#78350f' : '#fef3c7',
              },
            ]}
          >
            <View style={styles.noteTag}>
              <Text style={styles.noteTagText}>NOTE</Text>
            </View>
            <Text style={[styles.noteText, { color: isDark ? '#fde68a' : '#92400e' }]}>
              Choosing <Text style={{ fontWeight: '700' }}>"Upload Anyway"</Text> will delete the previous duplicate claim and trigger a fresh end-to-end OCR, ICD-10 coding & adjudication run.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Upload Anyway */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: '#0d9488' },
                isReprocessing && { opacity: 0.8 },
              ]}
              onPress={onUploadAnyway}
              disabled={isReprocessing}
              activeOpacity={0.8}
            >
              {isReprocessing ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <RefreshCw size={16} color="#ffffff" style={{ marginRight: 8 }} strokeWidth={2.4} />
              )}
              <Text style={styles.primaryBtnText}>
                {isReprocessing ? 'Processing...' : 'Upload Anyway'}
              </Text>
            </TouchableOpacity>

            {/* View Existing Claim */}
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: isDark ? '#082f49' : '#f0f9ff',
                  borderColor: isDark ? '#0284c7' : '#bae6fd',
                },
              ]}
              onPress={onViewExisting}
              disabled={isReprocessing}
              activeOpacity={0.8}
            >
              <Eye size={16} color="#0284c7" style={{ marginRight: 8 }} strokeWidth={2.2} />
              <Text style={[styles.secondaryBtnText, { color: '#0284c7' }]}>
                View Existing Claim
              </Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: colors.line,
                  backgroundColor: colors.surface2,
                },
              ]}
              onPress={onClose}
              disabled={isReprocessing}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.ink }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  noteBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  noteTag: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginTop: 1,
  },
  noteTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

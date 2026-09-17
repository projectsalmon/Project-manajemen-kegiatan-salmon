import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { ActivityItem, ActivityReport, UserProfile } from '../types';

interface FormalReportModalProps {
  visible: boolean;
  onClose: () => void;
  activity: ActivityItem;
  currentUser: UserProfile;
  onVerifyReport: (level: 'RW' | 'KELURAHAN') => Promise<void>;
  onEditReport?: () => void;
}

export const FormalReportModal: React.FC<FormalReportModalProps> = ({
  visible,
  onClose,
  activity,
  currentUser,
  onVerifyReport,
  onEditReport,
}) => {
  const report = activity.report;

  if (!report) return null;

  const isRW = currentUser.role === 'RW';
  const isAdmin = currentUser.role === 'STAF_KELURAHAN';
  const canVerifyRW = (isRW || isAdmin) && report.status === 'SUBMITTED';
  const canVerifyAdmin = isAdmin && report.status !== 'VERIFIED_KELURAHAN';

  const docNumber = `BA-${activity.id.slice(-5).toUpperCase()}/KMV/${activity.targetRegion.replace(/\s+/g, '')}/${new Date(report.submittedAt).getMonth() + 1}/${new Date(report.submittedAt).getFullYear()}`;

  const handleShareReport = async () => {
    const shareText = `*BERITA ACARA & LAPORAN PERTANGGUNGJAWABAN (LPJ)*
No. Registrasi: ${docNumber}
Aplikasi: KOMUNIVA (Sistem Manajemen Kegiatan Warga)

*Nama Kegiatan:* ${activity.title}
*Waktu:* ${activity.formattedDate} (${activity.timeSlot})
*Lokasi:* ${activity.locationName}
*Wilayah:* ${activity.targetRegion}
*Pelaksana:* ${report.submittedByUserName} (${report.submittedByUserRole})

*KEHADIRAN:*
• Kehadiran Riil: ${report.actualAttendeesCount} Warga
• Target RSVP Awal: ${activity.confirmedCount} Warga

*HASIL / NOTULENSI KEGIATAN:*
${report.notes}

${
  report.budgetSpent || report.budgetIncome
    ? `*AKUNTABILITAS ANGGARAN:*
• Pemasukan/Kas: Rp ${(report.budgetIncome || 0).toLocaleString('id-ID')}
• Realisasi Biaya: Rp ${(report.budgetSpent || 0).toLocaleString('id-ID')}
${report.budgetNotes ? `• Keterangan: ${report.budgetNotes}` : ''}`
    : ''
}

*STATUS PENGESAHAN:*
• Pelaksana RT: ${report.submittedByUserName} (Tercatat)
• Pengesahan RW: ${report.verifiedByRwName ? `Disahkan oleh ${report.verifiedByRwName}` : 'Menunggu Telaah'}
• Arsip Kelurahan: ${report.verifiedByAdminName ? `Disahkan oleh ${report.verifiedByAdminName}` : 'Menunggu Final'}

*Kode Verifikasi Digital:*
${report.qrVerificationCode || 'KMV-VALID-VERIFIED'}
Dokumen ini diterbitkan secara sah melalui sistem Komuniva.`;

    try {
      await Share.share({
        message: shareText,
        title: `Berita Acara - ${activity.title}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const getStatusBadge = () => {
    if (report.status === 'VERIFIED_KELURAHAN') {
      return {
        label: 'Sah & Terarsip Kelurahan',
        bg: '#DCFCE7',
        color: '#15803D',
        icon: 'seal-variant',
      };
    }
    if (report.status === 'VERIFIED_RW') {
      return {
        label: 'Disahkan Pengurus RW',
        bg: '#EFF6FF',
        color: '#1D4ED8',
        icon: 'check-decagram',
      };
    }
    return {
      label: 'Menunggu Pengesahan RW',
      bg: '#FEF3C7',
      color: '#B45309',
      icon: 'clock-outline',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Bar Controls */}
          <View style={styles.topControlBar}>
            <View style={styles.headerStatusWrap}>
              <View style={[styles.statusBadgePill, { backgroundColor: statusBadge.bg }]}>
                <MaterialCommunityIcons
                  name={statusBadge.icon as any}
                  size={14}
                  color={statusBadge.color}
                />
                <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>
            </View>

            <View style={styles.topActionBtns}>
              {onEditReport && (
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onEditReport}>
                  <MaterialCommunityIcons name="pencil" size={18} color="#081B38" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconCircleBtn} onPress={handleShareReport}>
                <MaterialCommunityIcons name="share-variant" size={18} color="#081B38" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircleBtn} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={20} color="#081B38" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Paper Sheet Document Preview */}
          <ScrollView style={styles.scrollDocumentArea} showsVerticalScrollIndicator={false}>
            <View style={styles.paperSheet}>
              {/* Kop Surat Resmi */}
              <View style={styles.kopSuratContainer}>
                <View style={styles.kopLogoWrap}>
                  <MaterialCommunityIcons name="shield-home" size={42} color="#081B38" />
                </View>
                <View style={styles.kopTextWrap}>
                  <Text style={styles.kopInstansi1}>PEMERINTAH KABUPATEN / KOTA</Text>
                  <Text style={styles.kopInstansi2}>KECAMATAN SUKAMAJU • KELURAHAN SUKAMAJU</Text>
                  <Text style={styles.kopInstansi3}>
                    FORUM RUKUN WARGA & RUKUN TETANGGA
                  </Text>
                  <Text style={styles.kopAlamat}>
                    Jl. Citra Warga No. 01 Sukamaju • Portal Resmi Komuniva
                  </Text>
                </View>
              </View>

              {/* Garis Ganda Kop Surat */}
              <View style={styles.kopDividerThick} />
              <View style={styles.kopDividerThin} />

              {/* Judul Dokumen */}
              <View style={styles.docTitleBlock}>
                <Text style={styles.docMainTitle}>BERITA ACARA & LAPORAN PERTANGGUNGJAWABAN</Text>
                <Text style={styles.docSubTitle}>PELAKSANAAN PROGRAM KERJA & KEGIATAN WARGA</Text>
                <Text style={styles.docRegNum}>Nomor: {docNumber}</Text>
              </View>

              {/* Rincian Kegiatan */}
              <Text style={styles.sectionHeaderTitle}>I. IDENTITAS KEGIATAN</Text>
              <View style={styles.specTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableColLabel}>Nama Agenda</Text>
                  <Text style={styles.tableColSep}>:</Text>
                  <Text style={[styles.tableColVal, styles.boldVal]}>{activity.title}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableColLabel}>Hari, Tanggal</Text>
                  <Text style={styles.tableColSep}>:</Text>
                  <Text style={styles.tableColVal}>{activity.formattedDate}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableColLabel}>Waktu</Text>
                  <Text style={styles.tableColSep}>:</Text>
                  <Text style={styles.tableColVal}>{activity.timeSlot}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableColLabel}>Tempat / Lokasi</Text>
                  <Text style={styles.tableColSep}>:</Text>
                  <Text style={styles.tableColVal}>{activity.locationName}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableColLabel}>Cakupan Wilayah</Text>
                  <Text style={styles.tableColSep}>:</Text>
                  <Text style={styles.tableColVal}>{activity.targetRegion}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableColLabel}>Penanggung Jawab</Text>
                  <Text style={styles.tableColSep}>:</Text>
                  <Text style={styles.tableColVal}>
                    {report.submittedByUserName} ({report.submittedByUserRole})
                  </Text>
                </View>
              </View>

              {/* Realisasi Partisipasi Warga */}
              <Text style={styles.sectionHeaderTitle}>II. TINGKAT PARTISIPASI WARGA</Text>
              <View style={styles.metricsBox}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricNumber}>{activity.confirmedCount}</Text>
                  <Text style={styles.metricLabel}>Target RSVP Awal</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: '#059669' }]}>
                    {report.actualAttendeesCount}
                  </Text>
                  <Text style={styles.metricLabel}>Kehadiran Riil</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={[styles.metricNumber, { color: '#0066F6' }]}>
                    {activity.confirmedCount > 0
                      ? `${Math.min(100, Math.round((report.actualAttendeesCount / activity.confirmedCount) * 100))}%`
                      : '100%'}
                  </Text>
                  <Text style={styles.metricLabel}>Rasio Hadir</Text>
                </View>
              </View>

              {/* Notulensi Hasil / Capaian */}
              <Text style={styles.sectionHeaderTitle}>III. NOTULENSI & CAPAIAN HASIL</Text>
              <View style={styles.notulensiBox}>
                <Text style={styles.notulensiContentText}>{report.notes}</Text>
              </View>

              {/* Akuntabilitas Anggaran (Jika ada) */}
              {(report.budgetSpent || report.budgetIncome) && (
                <>
                  <Text style={styles.sectionHeaderTitle}>IV. REALISASI ANGGARAN</Text>
                  <View style={styles.specTable}>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableColLabel}>Pemasukan / Iuran</Text>
                      <Text style={styles.tableColSep}>:</Text>
                      <Text style={styles.tableColVal}>
                        Rp {(report.budgetIncome || 0).toLocaleString('id-ID')}
                      </Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.tableColLabel}>Pengeluaran Riil</Text>
                      <Text style={styles.tableColSep}>:</Text>
                      <Text style={[styles.tableColVal, { color: '#DC2626', fontWeight: '700' }]}>
                        Rp {(report.budgetSpent || 0).toLocaleString('id-ID')}
                      </Text>
                    </View>
                    {report.budgetNotes && (
                      <View style={styles.tableRow}>
                        <Text style={styles.tableColLabel}>Keterangan</Text>
                        <Text style={styles.tableColSep}>:</Text>
                        <Text style={styles.tableColVal}>{report.budgetNotes}</Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Lampiran Dokumentasi Foto Kegiatan */}
              {report.photoUrls && report.photoUrls.length > 0 && (
                <>
                  <Text style={styles.sectionHeaderTitle}>
                    {report.budgetSpent || report.budgetIncome ? 'V.' : 'IV.'} DOKUMENTASI FOTO KEGIATAN
                  </Text>
                  <View style={styles.docPhotoGrid}>
                    {report.photoUrls.map((imgUrl, i) => (
                      <View key={i} style={styles.docPhotoItem}>
                        <Image source={{ uri: imgUrl }} style={styles.docPhotoImg} />
                        <Text style={styles.docPhotoCap}>Dokumentasi #{i + 1}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Tanda Tangan Pengesahan Tiga Tingkat */}
              <Text style={styles.sectionHeaderTitle}>LEMBAR PENGESAHAN BERJENJANG</Text>
              <Text style={styles.signDateCity}>
                Sukamaju, {new Date(report.submittedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>

              <View style={styles.signaturesRow}>
                {/* 1. Pelaksana RT */}
                <View style={styles.signColumn}>
                  <Text style={styles.signRole}>Pelaksana Lapangan / RT</Text>
                  <View style={styles.signStampBox}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#059669" />
                    <Text style={styles.signStampText}>TERDAFTAR RESMI</Text>
                  </View>
                  <Text style={styles.signName}>{report.submittedByUserName}</Text>
                  <Text style={styles.signTitle}>Koordinator Kegiatan</Text>
                </View>

                {/* 2. Pengurus RW */}
                <View style={styles.signColumn}>
                  <Text style={styles.signRole}>Mengetahui RW</Text>
                  <View style={styles.signStampBox}>
                    {report.verifiedByRwName ? (
                      <>
                        <MaterialCommunityIcons name="check-decagram" size={24} color="#0066F6" />
                        <Text style={[styles.signStampText, { color: '#0066F6' }]}>TELAH DISAHKAN</Text>
                      </>
                    ) : (
                      <Text style={styles.signPendingText}>(Menunggu Telaah)</Text>
                    )}
                  </View>
                  <Text style={styles.signName}>
                    {report.verifiedByRwName || 'Ketua RW Terkait'}
                  </Text>
                  <Text style={styles.signTitle}>Ketua Rukun Warga</Text>
                </View>
              </View>

              {/* 3. Mengetahui Staf Kelurahan (Center) */}
              <View style={styles.adminSignBox}>
                <Text style={styles.signRole}>Mengesahkan & Mengarsipkan:</Text>
                <Text style={styles.adminInstansiTitle}>KEPALA KELURAHAN SUKAMAJU</Text>
                <View style={styles.adminStampWrap}>
                  {report.verifiedByAdminName ? (
                    <View style={styles.verifiedAdminStamp}>
                      <MaterialCommunityIcons name="seal" size={28} color="#15803D" />
                      <Text style={styles.verifiedAdminStampText}>
                        ARSIP RESMI KELURAHAN SUKAMAJU
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.signPendingText}>(Menunggu Validasi Kelurahan)</Text>
                  )}
                </View>
                <Text style={styles.signName}>
                  {report.verifiedByAdminName || 'Lurah / Sekretaris Kelurahan'}
                </Text>
                <Text style={styles.signTitle}>NIP. 19820315 200801 1 004</Text>
              </View>

              {/* Digital Hash & QR Code Bar */}
              <View style={styles.digitalHashBar}>
                <View style={styles.qrIconWrap}>
                  <MaterialCommunityIcons name="qrcode-scan" size={36} color="#081B38" />
                </View>
                <View style={styles.qrTextWrap}>
                  <Text style={styles.qrHashTitle}>VERIFIKASI INTEGRITAS DIGITAL KOMUNIVA</Text>
                  <Text style={styles.qrHashVal}>{report.qrVerificationCode || 'KMV-VALID-SECURE'}</Text>
                  <Text style={styles.qrHashDesc}>
                    Keabsahan dokumen ini dapat diverifikasi langsung melalui database Cloud Firestore Komuniva.
                  </Text>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>

          {/* Bottom Action Approval Buttons (Untuk RW / Kelurahan) */}
          {(canVerifyRW || canVerifyAdmin) && (
            <View style={styles.footerApprovalBar}>
              {canVerifyRW && (
                <TouchableOpacity
                  style={[styles.actionVerifyBtn, { backgroundColor: '#0066F6' }]}
                  onPress={() => onVerifyReport('RW')}
                >
                  <MaterialCommunityIcons name="check-decagram" size={18} color={Colors.white} />
                  <Text style={styles.actionVerifyBtnText}>Sahkan Laporan (Tingkat RW)</Text>
                </TouchableOpacity>
              )}

              {canVerifyAdmin && (
                <TouchableOpacity
                  style={[styles.actionVerifyBtn, { backgroundColor: '#059669' }]}
                  onPress={() => onVerifyReport('KELURAHAN')}
                >
                  <MaterialCommunityIcons name="seal-variant" size={18} color={Colors.white} />
                  <Text style={styles.actionVerifyBtnText}>Sahkan & Arsipkan (Tingkat Kelurahan)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 27, 56, 0.85)',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  modalContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    maxHeight: '94%',
    display: 'flex',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  topControlBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerStatusWrap: {
    flex: 1,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollDocumentArea: {
    padding: 12,
  },
  paperSheet: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  kopSuratContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  kopLogoWrap: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kopTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  kopInstansi1: {
    fontSize: 13,
    fontWeight: '700',
    color: '#081B38',
    letterSpacing: 0.5,
  },
  kopInstansi2: {
    fontSize: 12,
    fontWeight: '800',
    color: '#081B38',
  },
  kopInstansi3: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  kopAlamat: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  kopDividerThick: {
    height: 2.5,
    backgroundColor: '#081B38',
    marginTop: 8,
  },
  kopDividerThin: {
    height: 1,
    backgroundColor: '#081B38',
    marginTop: 2,
    marginBottom: 16,
  },
  docTitleBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  docMainTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#081B38',
    textAlign: 'center',
  },
  docSubTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginTop: 2,
  },
  docRegNum: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0066F6',
    fontWeight: '700',
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#081B38',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#081B38',
    marginTop: 16,
    marginBottom: 8,
  },
  specTable: {
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tableColLabel: {
    width: 125,
    fontSize: 12,
    color: '#475569',
  },
  tableColSep: {
    width: 14,
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  tableColVal: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  boldVal: {
    fontWeight: '700',
    color: '#081B38',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    marginVertical: 6,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#081B38',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  notulensiBox: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  notulensiContentText: {
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 19,
  },
  docPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 8,
  },
  docPhotoItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  docPhotoImg: {
    width: '100%',
    height: 110,
  },
  docPhotoCap: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  signDateCity: {
    fontSize: 11.5,
    color: '#475569',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 10,
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signColumn: {
    width: '46%',
    alignItems: 'center',
  },
  signRole: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  signStampBox: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signStampText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  signPendingText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  signName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#081B38',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  signTitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  adminSignBox: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 20,
  },
  adminInstansiTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#081B38',
    marginTop: 2,
  },
  adminStampWrap: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedAdminStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedAdminStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  digitalHashBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  qrIconWrap: {
    padding: 4,
  },
  qrTextWrap: {
    flex: 1,
  },
  qrHashTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#081B38',
  },
  qrHashVal: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0066F6',
  },
  qrHashDesc: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  footerApprovalBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 10,
  },
  actionVerifyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionVerifyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

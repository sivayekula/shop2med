import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Animated,
  BackHandler,
} from 'react-native';
import { Text, Card, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useLogoutConfirmation } from '../../components/LogoutConfirmation';
import { formatCurrency } from '@/utils/formatters';
import MedicalBackground from '../../components/MedicalBackground';
import MedicalHeader from '../../components/MedicalHeader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// availableQuantity is a Mongoose virtual: quantity - soldQuantity - damagedQuantity
function availQty(item: any): number {
  if (typeof item.availableQuantity === 'number') return item.availableQuantity;
  return (item.quantity ?? 0) - (item.soldQuantity ?? 0) - (item.damagedQuantity ?? 0);
}

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  out_of_stock: { color: '#9E9E9E', bg: '#F5F5F5', label: 'No Stock' },
  low_stock:    { color: '#F57C00', bg: '#FFF3E0', label: 'Low'      },
  near_expiry:  { color: '#C8960C', bg: '#FFFDE7', label: 'Expiring' },
};
function cfg(status: string) { return STATUS[status] ?? { color: '#F57C00', bg: '#FFF3E0', label: 'Low' }; }

function fmtExpiry(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// ─── StockRow ─────────────────────────────────────────────────────────────────

function StockRow({ item, rank, isLast }: { item: any; rank: number; isLast: boolean }) {
  const s    = cfg(item.status);
  const avail = availQty(item);
  const ref   = (item.reorderLevel ?? 10);
  const pct   = avail <= 0 ? 0 : Math.min(100, Math.max(3, Math.round((avail / (ref * 3)) * 100)));
  const name  = item.medicineName ?? 'Unknown';
  const form  = item.medicine?.dosageForm ?? '';
  const unit  = item.medicine?.unit ?? 'units';
  const exp   = fmtExpiry(item.expiryDate);

  return (
    <View style={[ss.stockRow, !isLast && ss.rowBorder]}>
      {/* Rank badge */}
      <View style={[ss.rankBadge, { backgroundColor: s.bg }]}>
        <Text style={[ss.rankText, { color: s.color }]}>{rank}</Text>
      </View>

      {/* Info column */}
      <View style={ss.stockInfo}>
        <Text style={ss.stockName} numberOfLines={1}>{name}</Text>
        <Text style={ss.stockMeta}>{exp ? `Exp: ${exp}` : ''}</Text>
        {/* Progress bar */}
        {/* <View style={ss.barTrack}>
          <View style={[ss.barFill, { width: `${pct}%` as any, backgroundColor: s.color }]} />
        </View> */}
        {/* Status badge */}
        <View style={[ss.badge, { backgroundColor: s.bg }]}>
          <Text style={[ss.badgeText, { color: s.color }]}>{s.label.toUpperCase()}</Text>
        </View>
      </View>

      {/* Qty */}
      <View style={ss.stockRight}>
        <Text style={[ss.stockQty, { color: s.color }]}>{avail}</Text>
        <Text style={ss.stockUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ─── AddStockModal (2-step: pick item → set quantity) ─────────────────────────

function AddStockModal({
  visible, items, onClose, onSuccess,
}: { visible: boolean; items: any[]; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep]         = useState<'pick' | 'qty'>('pick');
  const [picked, setPicked]     = useState<any>(null);
  const [qty, setQty]           = useState('10');
  const [saving, setSaving]     = useState(false);

  function reset() { setStep('pick'); setPicked(null); setQty('10'); }
  function close() { reset(); onClose(); }

  async function confirm() {
    const q = parseInt(qty, 10);
    if (!picked || q < 1) { Alert.alert('Error', 'Enter at least 1'); return; }
    setSaving(true);
    try {
      // PATCH /inventory/:id/adjust  — type 'adjustment' adds to quantity
      await api.patch(`/inventory/${picked._id}/adjust`, {
        quantity: q,
        type: 'adjustment',
        reason: 'Stock replenishment from dashboard',
      });
      reset();
      onSuccess();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to add stock');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <TouchableOpacity style={ss.overlay} activeOpacity={1} onPress={close}>
        <TouchableOpacity activeOpacity={1} style={ss.sheet}>
          <View style={ss.handle} />

          {step === 'pick' ? (
            <>
              <Text style={ss.modalTitle}>📦 Add Stock</Text>
              <Text style={ss.modalSub}>Select an item to restock</Text>

              <FlatList
                data={items}
                keyExtractor={i => i._id}
                style={ss.pickList}
                ItemSeparatorComponent={() => <Divider />}
                renderItem={({ item }) => {
                  const s   = cfg(item.status);
                  const sel = picked?._id === item._id;
                  return (
                    <TouchableOpacity
                      style={[ss.pickRow, sel && ss.pickRowSel]}
                      onPress={() => setPicked(item)}
                    >
                      <View style={[ss.pickDot, { backgroundColor: s.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={ss.pickName}>{item.medicine?.name ?? 'Unknown'}</Text>
                        <Text style={ss.pickMeta}>
                          {item.medicine?.dosageForm} · {item.medicine?.strength || item.medicine?.unit}
                        </Text>
                      </View>
                      <Text style={[ss.pickQty, { color: s.color }]}>{availQty(item)}</Text>
                      {sel && (
                        <Icon name="check-circle" size={20} color="#4CAF50" style={{ marginLeft: 6 }} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[ss.btnPrimary, !picked && ss.btnDisabled]}
                onPress={() => picked && setStep('qty')}
                disabled={!picked}
              >
                <Text style={ss.btnPrimaryText}>Next →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ss.btnCancel} onPress={close}>
                <Text style={ss.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={ss.backRow} onPress={() => setStep('pick')}>
                <Icon name="arrow-left" size={16} color="#2196F3" />
                <Text style={ss.backText}> Back</Text>
              </TouchableOpacity>

              <Text style={ss.modalTitle}>Add Quantity</Text>

              {/* Selected item pill */}
              <View style={ss.selPill}>
                <View style={[ss.selDot, { backgroundColor: cfg(picked?.status).color }]} />
                <Text style={ss.selName}>{picked?.medicine?.name}</Text>
                <Text style={ss.selCur}>
                  Now: {availQty(picked)} {picked?.medicine?.unit}
                </Text>
              </View>

              {/* Stepper */}
              <View style={ss.stepper}>
                <TouchableOpacity
                  style={ss.stepBtn}
                  onPress={() => setQty(v => String(Math.max(1, parseInt(v, 10) - 1)))}
                >
                  <Text style={ss.stepBtnTxt}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={ss.stepInput}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={ss.stepBtn}
                  onPress={() => setQty(v => String((parseInt(v, 10) || 0) + 1))}
                >
                  <Text style={ss.stepBtnTxt}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[ss.btnPrimary, saving && ss.btnDisabled]}
                onPress={confirm}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={ss.btnPrimaryText}>✓ Confirm Add Stock</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={ss.btnCancel} onPress={close}>
                <Text style={ss.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── AddSaleModal (navigates to existing CreateOrder screen) ──────────────────

function AddSaleModal({
  visible, onClose, navigation,
}: { visible: boolean; onClose: () => void; navigation: any }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ss.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[ss.sheet, { paddingBottom: 40 }]}>
          <View style={ss.handle} />
          <Text style={ss.modalTitle}>🧾 New Sale</Text>
          <Text style={ss.modalSub}>Choose how to proceed</Text>

          {/* Option 1: Create new sale */}
          <TouchableOpacity
            style={ss.saleOpt}
            onPress={() => {
              onClose();
              navigation.navigate('SalesTab', { screen: 'CreateSale' });
            }}
          >
            <View style={[ss.saleOptIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="cart-plus" size={26} color="#4CAF50" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.saleOptTitle}>Create New Sale</Text>
              <Text style={ss.saleOptSub}>Add medicines, set quantity, apply discounts</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <Divider style={{ marginVertical: 4 }} />

          {/* Option 2: View all orders */}
          <TouchableOpacity
            style={ss.saleOpt}
            onPress={() => {
              onClose();
              navigation.navigate('SalesTab', { screen: 'Sales' });
            }}
          >
            <View style={[ss.saleOptIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="clipboard-list" size={26} color="#2196F3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.saleOptTitle}>View All Sales</Text>
              <Text style={ss.saleOptSub}>Browse and manage existing sales</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity style={[ss.btnCancel, { marginTop: 16 }]} onPress={onClose}>
            <Text style={ss.btnCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const [dashboard, setDashboard]   = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [saleModal, setSaleModal]   = useState(false);
  const { user } = useAuthStore();
  const { showLogoutConfirmation } = useLogoutConfirmation();

  useEffect(() => {
    const handleBackPress = () => {
      showLogoutConfirmation();
      return true; // Prevent default back behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      subscription.remove();
    };
  }, [showLogoutConfirmation]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setDashboard(res.data);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  if (loading) {
    return <View style={ss.centered}><ActivityIndicator size="large" /></View>;
  }

  // Already sorted ascending by quantity from backend
  const lowItems: any[] = dashboard?.lowStockAlerts ?? [];
  const totalInventory = dashboard?.totalInventory ?? 0;
  const isInventoryEmpty = totalInventory === 0;
  const allHealthy = !isInventoryEmpty && lowItems.length === 0;

  // Alert banner text parts
  const outCnt   = lowItems.filter(i => i.status === 'out_of_stock').length;
  const lowCnt   = lowItems.filter(i => i.status === 'low_stock').length;
  const expCnt   = dashboard?.alerts?.expiringSoon ?? 0;
  const bannerParts: string[] = [];
  if (outCnt) bannerParts.push(`${outCnt} Out of Stock`);
  if (lowCnt) bannerParts.push(`${lowCnt} Low Stock`);
  if (expCnt) bannerParts.push(`${expCnt} Expiring Soon`);

  return (
    <MedicalBackground variant="light">
      <ScrollView
        style={ss.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={ss.header}>
          <View>
            <Text variant="titleLarge" style={ss.shopName}>{user?.shopName}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}>
            <Icon name="account-circle" size={40} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={ss.statsRow}>
          <Card style={[ss.statCard, { backgroundColor: '#4CAF50' }]}>
            <Card.Content>
              <Text variant="labelMedium" style={ss.statLabel}>Today's Sales</Text>
              <Text variant="headlineMedium" style={ss.statValue}>{dashboard?.today.sales || 0}</Text>
              <Text variant="bodySmall" style={ss.statGrowth}>↑ {dashboard?.today.growth || 0}%</Text>
            </Card.Content>
          </Card>
          <Card style={[ss.statCard, { backgroundColor: '#2196F3' }]}>
            <Card.Content>
              <Text variant="labelMedium" style={ss.statLabel}>Today's Revenue</Text>
              <Text variant="headlineMedium" style={ss.statValue}>{formatCurrency(dashboard?.today.revenue || 0)}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Alert banner — only when issues exist */}
        {bannerParts.length > 0 && (
          <View style={ss.alertBanner}>
            <View style={ss.alertIconBox}>
              <Icon name="alert-circle" size={19} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.alertBannerTxt}>{bannerParts.join(' · ')}</Text>
              <Text style={ss.alertBannerSub}>Items need attention</Text>
            </View>
          </View>
        )}

        {/* ── Low Stock section OR All Healthy ── */}
        {isInventoryEmpty ? (
          <View style={[ss.allGoodCard, { borderColor: '#FFCDD2' }]}>
            <Text style={ss.allGoodEmoji}>📦</Text>
            <Text style={[ss.allGoodTitle, { color: '#E53935' }]}>No Stock Available</Text>
            <Text style={[ss.allGoodSub, { color: '#E53935' }]}>Add inventory items to get started</Text>
          </View>
        ) : allHealthy ? (
          <View style={ss.allGoodCard}>
            <Text style={ss.allGoodEmoji}>✅</Text>
            <Text style={ss.allGoodTitle}>All Stock is Healthy!</Text>
            <Text style={ss.allGoodSub}>Every item is above its reorder level</Text>
          </View>
        ) : (
          <View style={ss.section}>
            {/* Section header with + button */}
            <View style={ss.sectionHead}>
              <Text variant="titleLarge" style={ss.sectionTitle}>📦 Low Stock</Text>
              <View style={ss.sectionActions}>
                <TouchableOpacity onPress={() => navigation.navigate('InventoryTab')}>
                  <Text style={ss.seeAll}>See All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ss.plusBtn, { backgroundColor: '#4CAF50' }]}
                  onPress={() => setStockModal(true)}
                >
                  <Icon name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <Card style={ss.listCard}>
              {/* Sort chip */}
              <View style={ss.sortBar}>
                <Icon name="sort-ascending" size={13} color="#4CAF50" />
                <Text style={ss.sortTxt}>Sorted by: </Text>
                <View style={ss.sortChip}>
                  <Text style={ss.sortChipTxt}>↑ Low Qty First</Text>
                </View>
              </View>
              {lowItems.map((item, idx) => (
                <StockRow
                  key={`stock-${idx}-${item._id || item.medicineName}`}
                  item={item}
                  rank={idx + 1}
                  isLast={idx === lowItems.length - 1}
                />
              ))}
            </Card>
          </View>
        )}

        {/* ── Recent Sales section ── */}
        <View style={ss.section}>
          {/* Section header with + button */}
          <View style={ss.sectionHead}>
            <Text variant="titleLarge" style={ss.sectionTitle}>🧾 Recent Sales</Text>
            <View style={ss.sectionActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('SalesTab', { screen: 'Sales' })}
              >
                <Text style={ss.seeAll}>See All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.plusBtn, { backgroundColor: '#2196F3' }]}
                onPress={() => setSaleModal(true)}
              >
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {!dashboard?.recentSales?.length ? (
            <Card style={ss.listCard}>
              <View style={ss.emptyState}>
                <Icon name="receipt" size={36} color="#BDBDBD" />
                <Text style={ss.emptyTxt}>No sales recorded today</Text>
                <Text style={ss.emptyHint}>Tap + to record a sale</Text>
              </View>
            </Card>
          ) : (
            <Card style={ss.listCard}>
              {dashboard.recentSales.map((sale: any, idx: number) => {
                const isLast = idx === dashboard.recentSales.length - 1;
                return (
                  <View key={`sale-${idx}-${sale._id || sale.billNumber}`}>
                    <View style={ss.saleRow}>
                      <View style={ss.saleDot} />
                      <View style={ss.saleInfo}>
                        <Text style={ss.saleBill}>{sale.billNumber}</Text>
                        <Text style={ss.saleMeta}>
                          {sale.customerName || 'Walk-in'} · {sale.paymentMethod}
                        </Text>
                      </View>
                      <Text style={ss.saleAmt}>{formatCurrency(sale.totalAmount)}</Text>
                    </View>
                    {!isLast && <Divider />}
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modals */}
      <AddStockModal
        visible={stockModal}
        items={lowItems}
        onClose={() => setStockModal(false)}
        onSuccess={() => { setStockModal(false); fetchDashboard(); }}
      />
      <AddSaleModal
        visible={saleModal}
        onClose={() => setSaleModal(false)}
        navigation={navigation}
      />
    </MedicalBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  greet:    { color: '#757575', fontWeight: '500' },
  shopName: { fontWeight: 'bold', color: '#2196F3', marginTop: 2 },

  // Stats
  statsRow:  { flexDirection: 'row', padding: 10, gap: 10 },
  statCard:  { flex: 1, elevation: 2 },
  statLabel: { color: '#fff', opacity: 0.9 },
  statValue: { color: '#fff', fontWeight: 'bold', marginTop: 5 },
  statGrowth:{ color: '#fff', marginTop: 5 },

  // Alert banner
  alertBanner:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginBottom: 4, backgroundColor: '#FFEBEE', borderWidth: 1.5, borderColor: '#FFCDD2', borderRadius: 12, padding: 12, gap: 10 },
  alertIconBox:   { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E53935', justifyContent: 'center', alignItems: 'center' },
  alertBannerTxt: { fontSize: 13, fontWeight: '700', color: '#E53935' },
  alertBannerSub: { fontSize: 11, color: '#E53935', opacity: 0.8, marginTop: 1 },

  // All healthy card
  allGoodCard:  { margin: 10, backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#C8E6C9', elevation: 1 },
  allGoodEmoji: { fontSize: 40 },
  allGoodTitle: { fontSize: 16, fontWeight: '700', color: '#4CAF50', marginTop: 8 },
  allGoodSub:   { fontSize: 13, color: '#4CAF50', marginTop: 4, textAlign: 'center' },

  // Section layout
  section:       { paddingHorizontal: 10, marginTop: 4 },
  sectionHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  sectionTitle:  { fontWeight: 'bold' },
  sectionActions:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  seeAll:        { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  plusBtn:       { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Shared card container
  listCard: { overflow: 'hidden', elevation: 2 },

  // Sort bar inside list card
  sortBar:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sortTxt:     { fontSize: 12, color: '#6B7280' },
  sortChip:    { backgroundColor: '#E8F5EC', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  sortChipTxt: { fontSize: 11, fontWeight: '700', color: '#2E9C4A' },

  // Stock row
  stockRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rankBadge: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  rankText:  { fontSize: 11, fontWeight: '700' },
  stockInfo: { flex: 1, minWidth: 0 },
  stockName: { fontSize: 14, fontWeight: '600', color: '#1A1D23' },
  stockMeta: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  barTrack:  { height: 4, backgroundColor: '#E5E7EB', borderRadius: 4, marginTop: 5, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 4 },
  badge:     { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, marginTop: 4 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  stockRight:{ alignItems: 'flex-end' },
  stockQty:  { fontSize: 20, fontWeight: '700' },
  stockUnit: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  // Recent sales rows
  saleRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  saleDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  saleInfo: { flex: 1 },
  saleBill: { fontSize: 13, fontWeight: '600', color: '#1A1D23' },
  saleMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  saleAmt:  { fontSize: 15, fontWeight: '700', color: '#4CAF50' },
  emptyState:{ padding: 30, alignItems: 'center' },
  emptyTxt:  { fontSize: 14, color: '#9E9E9E', marginTop: 10, fontWeight: '500' },
  emptyHint: { fontSize: 12, color: '#BDBDBD', marginTop: 4 },

  // Modal shared
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, maxHeight: '90%' },
  handle:  { width: 36, height: 4, backgroundColor: '#E5E7EB', borderRadius: 4, alignSelf: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1D23', marginBottom: 4 },
  modalSub:   { fontSize: 13, color: '#6B7280', marginBottom: 14 },

  // Pick list
  pickList:   { maxHeight: 260, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 14 },
  pickRow:    { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  pickRowSel: { backgroundColor: '#E8F5E9' },
  pickDot:    { width: 10, height: 10, borderRadius: 5 },
  pickName:   { fontSize: 13, fontWeight: '600', color: '#1A1D23' },
  pickMeta:   { fontSize: 11, color: '#6B7280' },
  pickQty:    { fontSize: 13, fontWeight: '700' },

  // Back row
  backRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backText: { fontSize: 13, color: '#2196F3', fontWeight: '600' },

  // Selected pill (step 2)
  selPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F4F7', borderRadius: 10, padding: 12, marginBottom: 14, gap: 10 },
  selDot:  { width: 10, height: 10, borderRadius: 5 },
  selName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1D23' },
  selCur:  { fontSize: 12, color: '#6B7280' },

  // Stepper
  stepper:    { flexDirection: 'row', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  stepBtn:    { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  stepBtnTxt: { fontSize: 24, fontWeight: '700', color: '#4CAF50' },
  stepInput:  { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#1A1D23' },

  // Buttons
  btnPrimary:     { backgroundColor: '#4CAF50', padding: 13, borderRadius: 12, alignItems: 'center' },
  btnDisabled:    { backgroundColor: '#A5D6A7' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnCancel:      { padding: 10, alignItems: 'center', marginTop: 8 },
  btnCancelText:  { color: '#6B7280', fontSize: 14, fontWeight: '600' },

  // Sale options
  saleOpt:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  saleOptIcon:  { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saleOptTitle: { fontSize: 14, fontWeight: '700', color: '#1A1D23' },
  saleOptSub:   { fontSize: 12, color: '#6B7280', marginTop: 2 },
});

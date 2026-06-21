export type TempStatus = 'normal' | 'warning' | 'abnormal'

export type ReceiptConclusion = 'accepted' | 'partial_rejected' | 'pending_supervisor'

export type TempNodeType = 'loading' | 'transit' | 'arrival'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export type JudgeSuggestion = 'accept' | 'partial_reject' | 'report_supervisor'

export type ProductAppearance = 'normal' | 'slight_soft' | 'obvious_soft' | 'thawed'

export type HqDisposition = 'accepted' | 'partial_rejected' | 'returned' | 'discounted' | 'pending_review'

export interface AbnormalSegment {
  id: string
  startTime: string
  endTime: string
  durationMinutes: number
  maxTemp: number
  minTemp: number
  avgTemp: number
  carrierRemark: string
}

export interface AbnormalReview {
  segmentId: string
  appearance: ProductAppearance
  supplementPhotos: string[]
  reviewNote: string
  reviewedAt: string
  reviewerName: string
}

export interface HqCallbackResult {
  confirmNo: string
  confirmedAt: string
  handlerName: string
  handlingOpinion: string
  finalDisposition?: HqDisposition
  finalDispositionNote?: string
  disposedAt?: string
}

export interface TempNode {
  type: TempNodeType
  label: string
  status: TempStatus
  startTime: string
  endTime: string
  avgTemp: number
  tempRange: [number, number]
  abnormalCount: number
  abnormalSegments: AbnormalSegment[]
}

export interface WaybillInfo {
  id: string
  waybillNo: string
  productName: string
  productCount: number
  unit: string
  warehouse: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  tempZoneMin: number
  tempZoneMax: number
  tempZoneLabel: string
  shippedAt: string
  estimatedArrival: string
  actualArrival: string
}

export interface TemperatureRecord {
  time: string
  temperature: number
}

export interface ReceiptRecord {
  id: string
  waybillId: string
  waybillNo: string
  productName: string
  productCount: number
  unit: string
  warehouse: string
  vehicleNo: string
  driverName: string
  actualArrival: string
  overallStatus: TempStatus
  tempNodes: TempNode[]
  totalAbnormalMinutes: number
  abnormalReviews: AbnormalReview[]
  conclusion: ReceiptConclusion
  receiverName: string
  boxCountExpected: number
  boxCountActual: number
  boxDiff: number
  photos: string[]
  driverSignature: string
  driverConfirmed: boolean
  driverConfirmedAt: string
  remark: string
  syncStatus: SyncStatus
  syncError?: string
  syncAttempts: number
  submittedAt: string
  syncedAt?: string
  hqCallback?: HqCallbackResult
  createdAt: string
}

export interface ReceiptForm {
  conclusion: ReceiptConclusion | null
  boxCountExpected: number
  boxCountActual: number
  boxDiff: number
  photos: string[]
  remark: string
  driverName: string
  driverSignature: string
  driverConfirmedAt: string
  abnormalReviews: AbnormalReview[]
}

export interface UserInfo {
  id: string
  name: string
  phone: string
  storeName: string
  storeAddress: string
  role: string
  avatar: string
}

export interface JudgeResult {
  suggestion: JudgeSuggestion
  level: 'success' | 'warning' | 'danger'
  title: string
  description: string
  details: string[]
}

export interface SearchFilters {
  keyword: string
  dateFrom?: string
  dateTo?: string
  tempStatus?: TempStatus | 'all'
  conclusion?: ReceiptConclusion | 'all'
  onlyAbnormal?: boolean
  onlyPendingSupervisor?: boolean
  syncStatus?: SyncStatus | 'all'
}

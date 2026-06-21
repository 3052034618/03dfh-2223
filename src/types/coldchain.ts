export type TempStatus = 'normal' | 'warning' | 'abnormal'

export type ReceiptConclusion = 'accepted' | 'partial_rejected' | 'pending_supervisor'

export type TempNodeType = 'loading' | 'transit' | 'arrival'

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
  warehouse: string
  actualArrival: string
  overallStatus: TempStatus
  conclusion: ReceiptConclusion
  receiverName: string
  boxDiff: number
  photos: string[]
  driverConfirmed: boolean
  remark: string
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

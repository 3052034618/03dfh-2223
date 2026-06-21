import { create } from 'zustand'
import type {
  WaybillInfo,
  TempNode,
  ReceiptForm,
  TempStatus,
  ReceiptConclusion,
  ReceiptRecord,
  SyncStatus,
  JudgeResult,
  JudgeSuggestion
} from '@/types/coldchain'
import { findWaybillByNo, generateTempNodes, mockReceiptRecords, mockUser } from '@/data/mockData'

interface ReceiptState {
  currentStep: number
  waybillInfo: WaybillInfo | null
  tempNodes: TempNode[]
  overallStatus: TempStatus
  totalAbnormalMinutes: number
  form: ReceiptForm
  records: ReceiptRecord[]
  currentRecordId: string | null
  isScanning: boolean
  scanError: string | null

  setWaybillInfo: (info: WaybillInfo) => void
  setTempNodes: (nodes: TempNode[]) => void
  calculateOverallStatus: () => void
  calculateTotalAbnormalMinutes: () => void
  generateJudgeSuggestion: () => JudgeResult
  setConclusion: (conclusion: ReceiptConclusion) => void
  setBoxCount: (expected: number, actual: number) => void
  setPhotos: (photos: string[]) => void
  setRemark: (remark: string) => void
  setDriverConfirmed: (name: string, signature: string) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void

  scanWaybill: () => Promise<WaybillInfo | null>
  queryWaybill: (waybillNo: string) => WaybillInfo | undefined

  submitReceipt: () => Promise<ReceiptRecord>
  addRecord: (record: ReceiptRecord) => void
  updateRecordSyncStatus: (id: string, status: SyncStatus, error?: string) => void
  retrySync: (id: string) => Promise<void>
  retryAllFailed: () => Promise<void>
  getRecordById: (id: string) => ReceiptRecord | undefined
  filterRecords: (filter: string) => ReceiptRecord[]
}

const initialForm: ReceiptForm = {
  conclusion: null,
  boxCountExpected: 0,
  boxCountActual: 0,
  boxDiff: 0,
  photos: [],
  remark: '',
  driverName: '',
  driverSignature: '',
  driverConfirmedAt: ''
}

const generateId = (): string => {
  return 'REC' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

const simulateNetworkDelay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

const simulateSyncSuccess = (): Promise<boolean> =>
  new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.1), 800 + Math.random() * 1200))

export const useReceiptStore = create<ReceiptState>((set, get) => ({
  currentStep: 0,
  waybillInfo: null,
  tempNodes: [],
  overallStatus: 'normal',
  totalAbnormalMinutes: 0,
  form: initialForm,
  records: [...mockReceiptRecords],
  currentRecordId: null,
  isScanning: false,
  scanError: null,

  setWaybillInfo: (info) => {
    set({
      waybillInfo: info,
      form: {
        ...initialForm,
        boxCountExpected: info.productCount,
        boxCountActual: info.productCount
      }
    })
  },

  setTempNodes: (nodes) => set({ tempNodes: nodes }),

  calculateOverallStatus: () => {
    const { tempNodes } = get()
    if (tempNodes.some(n => n.status === 'abnormal')) {
      set({ overallStatus: 'abnormal' })
    } else if (tempNodes.some(n => n.status === 'warning')) {
      set({ overallStatus: 'warning' })
    } else {
      set({ overallStatus: 'normal' })
    }
  },

  calculateTotalAbnormalMinutes: () => {
    const { tempNodes } = get()
    const total = tempNodes.reduce((sum, node) => {
      return sum + node.abnormalSegments.reduce((segSum, seg) => segSum + seg.durationMinutes, 0)
    }, 0)
    set({ totalAbnormalMinutes: total })
    return total
  },

  generateJudgeSuggestion: (): JudgeResult => {
    const { overallStatus, totalAbnormalMinutes, tempNodes } = get()
    const details: string[] = []
    let suggestion: JudgeSuggestion
    let level: 'success' | 'warning' | 'danger'
    let title: string
    let description: string

    const normalNodes = tempNodes.filter(n => n.status === 'normal').length
    const warningNodes = tempNodes.filter(n => n.status === 'warning').length
    const abnormalNodes = tempNodes.filter(n => n.status === 'abnormal').length

    if (overallStatus === 'normal') {
      suggestion = 'accept'
      level = 'success'
      title = '温度全程达标'
      description = '本票货品冷链运输符合要求，建议正常接收'
      details.push('全程温度在约定范围内')
      details.push(`${normalNodes}个阶段温度正常`)
      if (totalAbnormalMinutes > 0) {
        details.push(`累计异常${totalAbnormalMinutes}分钟，在允许范围内`)
      }
    } else if (overallStatus === 'warning') {
      if (totalAbnormalMinutes <= 30 && abnormalNodes === 0) {
        suggestion = 'accept'
        level = 'warning'
        title = '温度轻微波动'
        description = '异常时间较短，建议检查货品外观后接收'
        details.push(`${warningNodes}个阶段温度偏高`)
        details.push(`累计异常${totalAbnormalMinutes}分钟，未超过30分钟阈值`)
        details.push('建议检查货品是否有解冻迹象')
      } else if (totalAbnormalMinutes <= 60) {
        suggestion = 'partial_reject'
        level = 'warning'
        title = '温度异常需关注'
        description = '异常时间较长，建议部分拒收异常货品'
        details.push(`${warningNodes}个阶段温度偏高`)
        details.push(`累计异常${totalAbnormalMinutes}分钟，可能影响部分货品`)
        details.push('建议检查每箱货品状态，拒收软化解冻部分')
      } else {
        suggestion = 'report_supervisor'
        level = 'danger'
        title = '温度异常时间较长'
        description = '异常时间超过60分钟，建议上报主管处理'
        details.push(`${warningNodes}个阶段温度偏高`)
        details.push(`累计异常${totalAbnormalMinutes}分钟`)
        details.push('需主管确认是否拒收或特殊处理')
      }
    } else {
      if (totalAbnormalMinutes <= 30) {
        suggestion = 'partial_reject'
        level = 'danger'
        title = '存在温度超标'
        description = '有阶段温度严重超标，建议检查后部分拒收'
        details.push(`${abnormalNodes}个阶段温度异常`)
        details.push(`累计异常${totalAbnormalMinutes}分钟`)
        details.push('建议逐箱检查，拒收明显解冻货品')
      } else if (totalAbnormalMinutes <= 60) {
        suggestion = 'report_supervisor'
        level = 'danger'
        title = '温度严重超标'
        description = '异常时间较长，建议上报主管确认处理方案'
        details.push(`${abnormalNodes}个阶段温度异常`)
        details.push(`累计异常${totalAbnormalMinutes}分钟`)
        details.push('可能存在批量质量问题，需主管决策')
      } else {
        suggestion = 'report_supervisor'
        level = 'danger'
        title = '全程温度严重异常'
        description = '异常时间过长，必须上报主管处理'
        details.push(`${abnormalNodes}个阶段温度异常`)
        details.push(`累计异常${totalAbnormalMinutes}分钟，超过60分钟`)
        details.push('存在较大食品安全风险，禁止自行接收')
      }
    }

    return { suggestion, level, title, description, details }
  },

  setConclusion: (conclusion) => {
    set(state => ({ form: { ...state.form, conclusion } }))
  },

  setBoxCount: (expected, actual) => {
    set(state => ({
      form: {
        ...state.form,
        boxCountExpected: expected,
        boxCountActual: actual,
        boxDiff: actual - expected
      }
    }))
  },

  setPhotos: (photos) => {
    set(state => ({ form: { ...state.form, photos } }))
  },

  setRemark: (remark) => {
    set(state => ({ form: { ...state.form, remark } }))
  },

  setDriverConfirmed: (name, signature) => {
    set(state => ({
      form: {
        ...state.form,
        driverName: name,
        driverSignature: signature,
        driverConfirmedAt: new Date().toISOString()
      }
    }))
  },

  nextStep: () => {
    set(state => ({ currentStep: Math.min(state.currentStep + 1, 2) }))
  },

  prevStep: () => {
    set(state => ({ currentStep: Math.max(state.currentStep - 1, 0) }))
  },

  reset: () => {
    set({
      currentStep: 0,
      waybillInfo: null,
      tempNodes: [],
      overallStatus: 'normal',
      totalAbnormalMinutes: 0,
      form: initialForm,
      currentRecordId: null,
      scanError: null
    })
  },

  scanWaybill: async (): Promise<WaybillInfo | null> => {
    const Taro = (await import('@tarojs/taro')).default
    set({ isScanning: true, scanError: null })

    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })

      if (!res.result) {
        set({ isScanning: false, scanError: '未获取到扫码内容' })
        return null
      }

      const scannedNo = res.result.trim()
      const waybill = findWaybillByNo(scannedNo)

      if (!waybill) {
        set({
          isScanning: false,
          scanError: `未找到运单「${scannedNo}」，请检查二维码是否正确`
        })
        return null
      }

      const tempNodes = generateTempNodes(waybill.id)
      set({
        isScanning: false,
        scanError: null
      })

      get().setWaybillInfo(waybill)
      get().setTempNodes(tempNodes)
      get().calculateOverallStatus()
      get().calculateTotalAbnormalMinutes()

      return waybill
    } catch (err: any) {
      if (err.errMsg && err.errMsg.includes('cancel')) {
        set({ isScanning: false, scanError: null })
      } else {
        set({ isScanning: false, scanError: '扫码失败，请重试' })
      }
      return null
    }
  },

  queryWaybill: (waybillNo: string): WaybillInfo | undefined => {
    const waybill = findWaybillByNo(waybillNo)
    if (waybill) {
      const tempNodes = generateTempNodes(waybill.id)
      get().setWaybillInfo(waybill)
      get().setTempNodes(tempNodes)
      get().calculateOverallStatus()
      get().calculateTotalAbnormalMinutes()
    }
    return waybill
  },

  submitReceipt: async (): Promise<ReceiptRecord> => {
    const { waybillInfo, tempNodes, overallStatus, totalAbnormalMinutes, form } = get()

    if (!waybillInfo || !form.conclusion) {
      throw new Error('请完成所有必填项')
    }

    const now = new Date().toISOString()
    const record: ReceiptRecord = {
      id: generateId(),
      waybillId: waybillInfo.id,
      waybillNo: waybillInfo.waybillNo,
      productName: waybillInfo.productName,
      productCount: waybillInfo.productCount,
      unit: waybillInfo.unit,
      warehouse: waybillInfo.warehouse,
      vehicleNo: waybillInfo.vehicleNo,
      driverName: form.driverName || waybillInfo.driverName,
      actualArrival: waybillInfo.actualArrival,
      overallStatus,
      tempNodes,
      totalAbnormalMinutes,
      conclusion: form.conclusion,
      receiverName: mockUser.name,
      boxCountExpected: form.boxCountExpected,
      boxCountActual: form.boxCountActual,
      boxDiff: form.boxDiff,
      photos: [...form.photos],
      driverSignature: form.driverSignature,
      driverConfirmed: !!form.driverSignature,
      driverConfirmedAt: form.driverConfirmedAt || now,
      remark: form.remark,
      syncStatus: 'pending',
      syncAttempts: 0,
      submittedAt: now,
      createdAt: now
    }

    get().addRecord(record)
    set({ currentRecordId: record.id })

    setTimeout(() => {
      get().updateRecordSyncStatus(record.id, 'syncing')
      get().retrySync(record.id)
    }, 100)

    return record
  },

  addRecord: (record) => {
    set(state => ({
      records: [record, ...state.records]
    }))
  },

  updateRecordSyncStatus: (id, status, error) => {
    set(state => ({
      records: state.records.map(r => {
        if (r.id === id) {
          const updates: Partial<ReceiptRecord> = {
            syncStatus: status,
            syncAttempts: r.syncAttempts + 1
          }
          if (status === 'synced') {
            updates.syncedAt = new Date().toISOString()
          }
          if (error) {
            updates.syncError = error
          } else if (status !== 'failed') {
            updates.syncError = undefined
          }
          return { ...r, ...updates }
        }
        return r
      })
    }))
  },

  retrySync: async (id) => {
    const record = get().getRecordById(id)
    if (!record) return

    if (record.syncStatus === 'synced') return

    get().updateRecordSyncStatus(id, 'syncing')
    await simulateNetworkDelay(500)

    const success = await simulateSyncSuccess()

    if (success) {
      get().updateRecordSyncStatus(id, 'synced')
    } else {
      if (record.syncAttempts >= 2) {
        get().updateRecordSyncStatus(id, 'failed', '网络连接超时，请检查网络后重试')
      } else {
        setTimeout(() => {
          get().retrySync(id)
        }, 2000)
      }
    }
  },

  retryAllFailed: async () => {
    const failedRecords = get().records.filter(r => r.syncStatus === 'failed')
    for (const record of failedRecords) {
      await get().retrySync(record.id)
    }
  },

  getRecordById: (id) => {
    return get().records.find(r => r.id === id)
  },

  filterRecords: (filter) => {
    const { records } = get()
    if (filter === 'all') return records
    if (filter === 'pending_sync') return records.filter(r => r.syncStatus !== 'synced')
    if (filter === 'normal') return records.filter(r => r.overallStatus === 'normal')
    if (filter === 'warning') return records.filter(r => r.overallStatus === 'warning')
    if (filter === 'abnormal') return records.filter(r => r.overallStatus === 'abnormal')
    if (filter === 'accepted') return records.filter(r => r.conclusion === 'accepted')
    if (filter === 'partial_rejected') return records.filter(r => r.conclusion === 'partial_rejected')
    if (filter === 'pending_supervisor') return records.filter(r => r.conclusion === 'pending_supervisor')
    return records
  }
}))

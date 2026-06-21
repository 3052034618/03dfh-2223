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
  JudgeSuggestion,
  AbnormalReview,
  ProductAppearance,
  SearchFilters,
  HqCallbackResult,
  HqDisposition
} from '@/types/coldchain'
import { findWaybillByNo, generateTempNodes, mockReceiptRecords, mockUser } from '@/data/mockData'
import { loadRecordsFromStorage, saveRecordsToStorage } from '@/utils/storage'

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
  isInitialized: boolean

  initFromStorage: () => void
  persistRecords: () => void

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

  addAbnormalReview: (review: Omit<AbnormalReview, 'reviewedAt' | 'reviewerName'>) => void
  updateAbnormalReview: (segmentId: string, updates: Partial<AbnormalReview>) => void
  removeAbnormalReview: (segmentId: string) => void
  getAbnormalReview: (segmentId: string) => AbnormalReview | undefined

  scanWaybill: () => Promise<WaybillInfo | null>
  queryWaybill: (waybillNo: string) => WaybillInfo | undefined

  submitReceipt: () => Promise<ReceiptRecord>
  addRecord: (record: ReceiptRecord) => void
  updateRecordSyncStatus: (id: string, status: SyncStatus, error?: string) => void
  retrySync: (id: string) => Promise<void>
  retryAllFailed: () => Promise<void>
  getRecordById: (id: string) => ReceiptRecord | undefined
  filterRecords: (filter: string) => ReceiptRecord[]
  searchRecords: (filters: SearchFilters) => ReceiptRecord[]

  simulateHqCallback: (recordId: string) => void
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
  driverConfirmedAt: '',
  abnormalReviews: []
}

const generateId = (): string => {
  return 'REC' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

const generateConfirmNo = (): string => {
  const date = new Date()
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `HQ${dateStr}${random}`
}

const simulateNetworkDelay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

const simulateSyncSuccess = (): Promise<boolean> =>
  new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.1), 800 + Math.random() * 1200))

const simulateHqDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000))

const generateHqCallback = (conclusion: ReceiptConclusion, overallStatus: TempStatus): HqCallbackResult => {
  const now = new Date()
  const handlers = ['张主管', '李经理', '王总监', '赵专员']
  const handlerName = handlers[Math.floor(Math.random() * handlers.length)]

  let finalDisposition: HqDisposition | undefined
  let finalDispositionNote: string | undefined

  if (conclusion === 'accepted') {
    finalDisposition = 'accepted'
    finalDispositionNote = '温度在允许范围内，货品正常，同意门店接收'
  } else if (conclusion === 'partial_rejected') {
    if (overallStatus === 'warning') {
      finalDisposition = 'partial_rejected'
      finalDispositionNote = '已确认异常货品，同意部分拒收，拒收部分由承运方承担'
    } else {
      finalDisposition = 'discounted'
      finalDispositionNote = '异常时间较长，建议按8折接收，损失由承运方承担'
    }
  } else if (conclusion === 'pending_supervisor') {
    if (overallStatus === 'abnormal') {
      finalDisposition = 'returned'
      finalDispositionNote = '温度严重超标，存在食品安全风险，整单退回承运方'
    } else {
      finalDisposition = 'accepted'
      finalDispositionNote = '经评估，货品未受影响，同意正常接收'
    }
  }

  return {
    confirmNo: generateConfirmNo(),
    confirmedAt: now.toISOString(),
    handlerName,
    handlingOpinion: conclusion === 'accepted'
      ? '已核查冷链记录，同意门店处理意见'
      : '已收到门店验收报告，正在复核中',
    finalDisposition,
    finalDispositionNote,
    disposedAt: finalDisposition ? new Date(now.getTime() + 60000).toISOString() : undefined
  }
}

export const useReceiptStore = create<ReceiptState>((set, get) => ({
  currentStep: 0,
  waybillInfo: null,
  tempNodes: [],
  overallStatus: 'normal',
  totalAbnormalMinutes: 0,
  form: initialForm,
  records: [],
  currentRecordId: null,
  isScanning: false,
  scanError: null,
  isInitialized: false,

  initFromStorage: () => {
    if (get().isInitialized) return

    const storedRecords = loadRecordsFromStorage()
    if (storedRecords && storedRecords.length > 0) {
      set({ records: storedRecords, isInitialized: true })
    } else {
      set({ records: [...mockReceiptRecords], isInitialized: true })
      saveRecordsToStorage([...mockReceiptRecords])
    }

    const pendingRecords = get().records.filter(r => r.syncStatus !== 'synced')
    pendingRecords.forEach(record => {
      if (record.syncStatus === 'pending') {
        setTimeout(() => {
          get().updateRecordSyncStatus(record.id, 'syncing')
          get().retrySync(record.id)
        }, 500 + Math.random() * 1000)
      }
    })
  },

  persistRecords: () => {
    saveRecordsToStorage(get().records)
  },

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

  addAbnormalReview: (review) => {
    const now = new Date().toISOString()
    const newReview: AbnormalReview = {
      ...review,
      reviewedAt: now,
      reviewerName: mockUser.name
    }
    set(state => {
      const existingIndex = state.form.abnormalReviews.findIndex(r => r.segmentId === review.segmentId)
      let newReviews
      if (existingIndex >= 0) {
        newReviews = [...state.form.abnormalReviews]
        newReviews[existingIndex] = newReview
      } else {
        newReviews = [...state.form.abnormalReviews, newReview]
      }
      return {
        form: { ...state.form, abnormalReviews: newReviews }
      }
    })
  },

  updateAbnormalReview: (segmentId, updates) => {
    set(state => ({
      form: {
        ...state.form,
        abnormalReviews: state.form.abnormalReviews.map(r =>
          r.segmentId === segmentId ? { ...r, ...updates } : r
        )
      }
    }))
  },

  removeAbnormalReview: (segmentId) => {
    set(state => ({
      form: {
        ...state.form,
        abnormalReviews: state.form.abnormalReviews.filter(r => r.segmentId !== segmentId)
      }
    }))
  },

  getAbnormalReview: (segmentId) => {
    return get().form.abnormalReviews.find(r => r.segmentId === segmentId)
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
      abnormalReviews: [...form.abnormalReviews],
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
    get().persistRecords()

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
    setTimeout(() => get().persistRecords(), 0)
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
    setTimeout(() => get().persistRecords(), 0)
  },

  retrySync: async (id) => {
    const record = get().getRecordById(id)
    if (!record) return

    if (record.syncStatus === 'synced') {
      if (!record.hqCallback) {
        get().simulateHqCallback(id)
      }
      return
    }

    get().updateRecordSyncStatus(id, 'syncing')
    await simulateNetworkDelay(500)

    const success = await simulateSyncSuccess()

    if (success) {
      get().updateRecordSyncStatus(id, 'synced')
      get().simulateHqCallback(id)
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

  simulateHqCallback: async (recordId) => {
    const record = get().getRecordById(recordId)
    if (!record || record.hqCallback) return

    await simulateHqDelay()

    const currentRecord = get().getRecordById(recordId)
    if (!currentRecord || currentRecord.syncStatus !== 'synced') return

    const hqCallback = generateHqCallback(record.conclusion, record.overallStatus)

    set(state => ({
      records: state.records.map(r =>
        r.id === recordId
          ? { ...r, hqCallback }
          : r
      )
    }))
    setTimeout(() => get().persistRecords(), 0)
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
  },

  searchRecords: (filters) => {
    const { records } = get()
    let result = [...records]

    if (filters.keyword && filters.keyword.trim()) {
      const keyword = filters.keyword.trim().toLowerCase()
      result = result.filter(r =>
        r.waybillNo.toLowerCase().includes(keyword) ||
        r.productName.toLowerCase().includes(keyword) ||
        r.driverName.toLowerCase().includes(keyword) ||
        r.warehouse.toLowerCase().includes(keyword) ||
        r.vehicleNo.toLowerCase().includes(keyword)
      )
    }

    if (filters.dateFrom) {
      result = result.filter(r => r.createdAt >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      result = result.filter(r => r.createdAt <= filters.dateTo + ' 23:59:59')
    }

    if (filters.tempStatus && filters.tempStatus !== 'all') {
      result = result.filter(r => r.overallStatus === filters.tempStatus)
    }

    if (filters.conclusion && filters.conclusion !== 'all') {
      result = result.filter(r => r.conclusion === filters.conclusion)
    }

    if (filters.onlyAbnormal) {
      result = result.filter(r => r.overallStatus !== 'normal')
    }

    if (filters.onlyPendingSupervisor) {
      result = result.filter(r => r.conclusion === 'pending_supervisor')
    }

    if (filters.syncStatus && filters.syncStatus !== 'all') {
      if (filters.syncStatus === 'pending') {
        result = result.filter(r => r.syncStatus !== 'synced')
      } else {
        result = result.filter(r => r.syncStatus === filters.syncStatus)
      }
    }

    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
}))

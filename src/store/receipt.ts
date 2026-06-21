import { create } from 'zustand'
import type {
  WaybillInfo,
  TempNode,
  ReceiptForm,
  TempStatus,
  ReceiptConclusion
} from '@/types/coldchain'

interface ReceiptState {
  currentStep: number
  waybillInfo: WaybillInfo | null
  tempNodes: TempNode[]
  overallStatus: TempStatus
  form: ReceiptForm
  setWaybillInfo: (info: WaybillInfo) => void
  setTempNodes: (nodes: TempNode[]) => void
  calculateOverallStatus: () => void
  setConclusion: (conclusion: ReceiptConclusion) => void
  setBoxCount: (expected: number, actual: number) => void
  setPhotos: (photos: string[]) => void
  setRemark: (remark: string) => void
  setDriverConfirmed: (name: string, signature: string) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
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

export const useReceiptStore = create<ReceiptState>((set, get) => ({
  currentStep: 0,
  waybillInfo: null,
  tempNodes: [],
  overallStatus: 'normal',
  form: initialForm,

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
      form: initialForm
    })
  }
}))

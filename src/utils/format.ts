import dayjs from 'dayjs'
import type { TempStatus, ReceiptConclusion } from '@/types/coldchain'

export const formatDateTime = (dateStr: string, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(dateStr).format(format)
}

export const formatDate = (dateStr: string, format = 'YYYY-MM-DD'): string => {
  return dayjs(dateStr).format(format)
}

export const formatTime = (dateStr: string, format = 'HH:mm'): string => {
  return dayjs(dateStr).format(format)
}

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

export const formatTemp = (temp: number): string => {
  return `${temp.toFixed(1)}℃`
}

export const getStatusLabel = (status: TempStatus): string => {
  const map: Record<TempStatus, string> = {
    normal: '温度达标',
    warning: '温度偏高',
    abnormal: '温度异常'
  }
  return map[status]
}

export const getConclusionLabel = (conclusion: ReceiptConclusion): string => {
  const map: Record<ReceiptConclusion, string> = {
    accepted: '正常接收',
    partial_rejected: '部分拒收',
    pending_supervisor: '待主管确认'
  }
  return map[conclusion]
}

export const getTempStatusColor = (status: TempStatus): string => {
  const map: Record<TempStatus, string> = {
    normal: '#00B42A',
    warning: '#FF7D00',
    abnormal: '#F53F3F'
  }
  return map[status]
}

export const getConclusionColor = (conclusion: ReceiptConclusion): string => {
  const map: Record<ReceiptConclusion, string> = {
    accepted: '#00B42A',
    partial_rejected: '#FF7D00',
    pending_supervisor: '#165DFF'
  }
  return map[conclusion]
}

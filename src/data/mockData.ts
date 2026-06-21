import type {
  WaybillInfo,
  TempNode,
  ReceiptRecord,
  UserInfo,
  TemperatureRecord
} from '@/types/coldchain'

export const mockWaybill: WaybillInfo = {
  id: 'WB20240615001',
  waybillNo: 'CC-20240615-00892',
  productName: '冻猪排骨（精修）',
  productCount: 120,
  unit: '箱',
  warehouse: '上海冷链中心仓（青浦）',
  vehicleNo: '沪A·88F29',
  driverName: '张建国',
  driverPhone: '138****5678',
  tempZoneMin: -20,
  tempZoneMax: -12,
  tempZoneLabel: '深冻区 (-20℃ ~ -12℃)',
  shippedAt: '2024-06-15 03:30:00',
  estimatedArrival: '2024-06-15 09:30:00',
  actualArrival: '2024-06-15 09:15:00'
}

export const mockTempNodes: TempNode[] = [
  {
    type: 'loading',
    label: '装车阶段',
    status: 'normal',
    startTime: '2024-06-15 02:15:00',
    endTime: '2024-06-15 03:30:00',
    avgTemp: -17.2,
    tempRange: [-18.5, -15.8],
    abnormalCount: 0,
    abnormalSegments: []
  },
  {
    type: 'transit',
    label: '途中运输',
    status: 'warning',
    startTime: '2024-06-15 03:30:00',
    endTime: '2024-06-15 08:45:00',
    avgTemp: -14.8,
    tempRange: [-17.8, -10.2],
    abnormalCount: 2,
    abnormalSegments: [
      {
        id: 'ABN001',
        startTime: '2024-06-15 05:12:00',
        endTime: '2024-06-15 05:38:00',
        durationMinutes: 26,
        maxTemp: -10.2,
        minTemp: -12.8,
        avgTemp: -11.5,
        carrierRemark: '途经高速服务区临时停车检查，车门开启约5分钟'
      },
      {
        id: 'ABN002',
        startTime: '2024-06-15 07:20:00',
        endTime: '2024-06-15 07:45:00',
        durationMinutes: 25,
        maxTemp: -10.8,
        minTemp: -13.2,
        avgTemp: -11.9,
        carrierRemark: '市区拥堵路段，制冷机组频繁启停'
      }
    ]
  },
  {
    type: 'arrival',
    label: '到店开门',
    status: 'normal',
    startTime: '2024-06-15 08:45:00',
    endTime: '2024-06-15 09:15:00',
    avgTemp: -16.5,
    tempRange: [-17.8, -15.0],
    abnormalCount: 0,
    abnormalSegments: []
  }
]

export const mockTempRecords: TemperatureRecord[] = Array.from({ length: 60 }, (_, i) => ({
  time: `2024-06-15 ${String(2 + Math.floor(i / 12)).padStart(2, '0')}:${String((i % 12) * 5).padStart(2, '0')}:00`,
  temperature: -18 + Math.sin(i * 0.3) * 3 + (i > 30 && i < 40 ? 5 : 0) + (Math.random() - 0.5)
}))

export const mockReceiptRecords: ReceiptRecord[] = [
  {
    id: 'REC001',
    waybillId: 'WB20240615001',
    waybillNo: 'CC-20240615-00892',
    productName: '冻猪排骨（精修）',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-15 09:15:00',
    overallStatus: 'warning',
    conclusion: 'accepted',
    receiverName: '李明',
    boxDiff: 0,
    photos: [
      'https://picsum.photos/id/292/600/400',
      'https://picsum.photos/id/312/600/400'
    ],
    driverConfirmed: true,
    remark: '途中温度略有偏高，时间不长，货品状态良好',
    createdAt: '2024-06-15 09:32:00'
  },
  {
    id: 'REC002',
    waybillId: 'WB20240614003',
    waybillNo: 'CC-20240614-00756',
    productName: '冷鲜牛肉片',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-14 10:20:00',
    overallStatus: 'normal',
    conclusion: 'accepted',
    receiverName: '李明',
    boxDiff: 0,
    photos: ['https://picsum.photos/id/431/600/400'],
    driverConfirmed: true,
    remark: '',
    createdAt: '2024-06-14 10:45:00'
  },
  {
    id: 'REC003',
    waybillId: 'WB20240614002',
    waybillNo: 'CC-20240614-00634',
    productName: '冻虾仁（26/30）',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-14 07:45:00',
    overallStatus: 'abnormal',
    conclusion: 'pending_supervisor',
    receiverName: '李明',
    boxDiff: -2,
    photos: [
      'https://picsum.photos/id/326/600/400',
      'https://picsum.photos/id/570/600/400'
    ],
    driverConfirmed: true,
    remark: '途中温度超标持续1小时20分，部分货品有软化迹象，短少2箱，已上报主管',
    createdAt: '2024-06-14 08:10:00'
  },
  {
    id: 'REC004',
    waybillId: 'WB20240613005',
    waybillNo: 'CC-20240613-00921',
    productName: '冷藏蔬菜组合包',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-13 08:30:00',
    overallStatus: 'normal',
    conclusion: 'accepted',
    receiverName: '王芳',
    boxDiff: 0,
    photos: ['https://picsum.photos/id/580/600/400'],
    driverConfirmed: true,
    remark: '',
    createdAt: '2024-06-13 08:55:00'
  },
  {
    id: 'REC005',
    waybillId: 'WB20240613003',
    waybillNo: 'CC-20240613-00587',
    productName: '冻鸡腿肉',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-13 06:50:00',
    overallStatus: 'normal',
    conclusion: 'accepted',
    receiverName: '李明',
    boxDiff: 1,
    photos: ['https://picsum.photos/id/625/600/400'],
    driverConfirmed: true,
    remark: '实收多1箱，司机确认补发',
    createdAt: '2024-06-13 07:15:00'
  },
  {
    id: 'REC006',
    waybillId: 'WB20240612004',
    waybillNo: 'CC-20240612-00812',
    productName: '冰淇淋（多口味）',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-12 09:00:00',
    overallStatus: 'warning',
    conclusion: 'partial_rejected',
    receiverName: '王芳',
    boxDiff: -3,
    photos: [
      'https://picsum.photos/id/835/600/400',
      'https://picsum.photos/id/1080/600/400'
    ],
    driverConfirmed: true,
    remark: '3箱草莓口味冰淇淋软化变形，拒收，其余正常',
    createdAt: '2024-06-12 09:30:00'
  },
  {
    id: 'REC007',
    waybillId: 'WB20240612001',
    waybillNo: 'CC-20240612-00423',
    productName: '冷鲜三文鱼',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-12 07:20:00',
    overallStatus: 'normal',
    conclusion: 'accepted',
    receiverName: '李明',
    boxDiff: 0,
    photos: ['https://picsum.photos/id/401/600/400'],
    driverConfirmed: true,
    remark: '',
    createdAt: '2024-06-12 07:40:00'
  },
  {
    id: 'REC008',
    waybillId: 'WB20240611006',
    waybillNo: 'CC-20240611-00768',
    productName: '冻水饺（猪肉白菜）',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-11 08:15:00',
    overallStatus: 'normal',
    conclusion: 'accepted',
    receiverName: '王芳',
    boxDiff: 0,
    photos: ['https://picsum.photos/id/292/600/400'],
    driverConfirmed: true,
    remark: '',
    createdAt: '2024-06-11 08:35:00'
  },
  {
    id: 'REC009',
    waybillId: 'WB20240611002',
    waybillNo: 'CC-20240611-00345',
    productName: '冷藏鲜奶',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-11 06:40:00',
    overallStatus: 'normal',
    conclusion: 'accepted',
    receiverName: '李明',
    boxDiff: 0,
    photos: ['https://picsum.photos/id/312/600/400'],
    driverConfirmed: true,
    remark: '',
    createdAt: '2024-06-11 07:00:00'
  },
  {
    id: 'REC010',
    waybillId: 'WB20240610004',
    waybillNo: 'CC-20240610-00678',
    productName: '冻鸡翅中',
    warehouse: '上海冷链中心仓（青浦）',
    actualArrival: '2024-06-10 08:50:00',
    overallStatus: 'abnormal',
    conclusion: 'pending_supervisor',
    receiverName: '王芳',
    boxDiff: 0,
    photos: [
      'https://picsum.photos/id/326/600/400'
    ],
    driverConfirmed: true,
    remark: '全程温度偏高，货品已部分解冻，等待主管确认处理方案',
    createdAt: '2024-06-10 09:15:00'
  }
]

export const mockUser: UserInfo = {
  id: 'U001',
  name: '李明',
  phone: '139****1234',
  storeName: '鲜丰优选（浦东张江店）',
  storeAddress: '上海市浦东新区张江高科技园区科苑路88号',
  role: '门店收货员',
  avatar: 'https://picsum.photos/id/64/200/200'
}

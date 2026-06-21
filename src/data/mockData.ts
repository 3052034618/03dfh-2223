import type {
  WaybillInfo,
  TempNode,
  ReceiptRecord,
  UserInfo,
  TemperatureRecord
} from '@/types/coldchain'

export const mockWaybills: WaybillInfo[] = [
  {
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
  },
  {
    id: 'WB20240615002',
    waybillNo: 'CC-20240615-00956',
    productName: '冷鲜牛肉片（澳洲和牛）',
    productCount: 80,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪B·35K61',
    driverName: '李志强',
    driverPhone: '139****8899',
    tempZoneMin: 0,
    tempZoneMax: 4,
    tempZoneLabel: '冷藏区 (0℃ ~ 4℃)',
    shippedAt: '2024-06-15 05:00:00',
    estimatedArrival: '2024-06-15 10:00:00',
    actualArrival: '2024-06-15 09:45:00'
  },
  {
    id: 'WB20240615003',
    waybillNo: 'CC-20240615-01023',
    productName: '冻虾仁（26/30规格）',
    productCount: 200,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪C·77M12',
    driverName: '王海军',
    driverPhone: '137****6655',
    tempZoneMin: -20,
    tempZoneMax: -15,
    tempZoneLabel: '深冻区 (-20℃ ~ -15℃)',
    shippedAt: '2024-06-15 02:00:00',
    estimatedArrival: '2024-06-15 08:00:00',
    actualArrival: '2024-06-15 07:50:00'
  },
  {
    id: 'WB20240615004',
    waybillNo: 'CC-20240615-01156',
    productName: '冰淇淋（混合口味）',
    productCount: 150,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪A·99G88',
    driverName: '赵德胜',
    driverPhone: '136****3344',
    tempZoneMin: -25,
    tempZoneMax: -18,
    tempZoneLabel: '超冻区 (-25℃ ~ -18℃)',
    shippedAt: '2024-06-15 04:00:00',
    estimatedArrival: '2024-06-15 11:00:00',
    actualArrival: '2024-06-15 10:30:00'
  }
]

export const generateTempNodes = (waybillId: string): TempNode[] => {
  const baseNodes: Record<string, TempNode[]> = {
    'WB20240615001': [
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
    ],
    'WB20240615002': [
      {
        type: 'loading',
        label: '装车阶段',
        status: 'normal',
        startTime: '2024-06-15 04:00:00',
        endTime: '2024-06-15 05:00:00',
        avgTemp: 2.1,
        tempRange: [1.0, 3.5],
        abnormalCount: 0,
        abnormalSegments: []
      },
      {
        type: 'transit',
        label: '途中运输',
        status: 'normal',
        startTime: '2024-06-15 05:00:00',
        endTime: '2024-06-15 09:20:00',
        avgTemp: 2.8,
        tempRange: [1.5, 3.8],
        abnormalCount: 0,
        abnormalSegments: []
      },
      {
        type: 'arrival',
        label: '到店开门',
        status: 'normal',
        startTime: '2024-06-15 09:20:00',
        endTime: '2024-06-15 09:45:00',
        avgTemp: 3.2,
        tempRange: [2.0, 4.0],
        abnormalCount: 0,
        abnormalSegments: []
      }
    ],
    'WB20240615003': [
      {
        type: 'loading',
        label: '装车阶段',
        status: 'normal',
        startTime: '2024-06-15 01:00:00',
        endTime: '2024-06-15 02:00:00',
        avgTemp: -18.5,
        tempRange: [-19.5, -17.0],
        abnormalCount: 0,
        abnormalSegments: []
      },
      {
        type: 'transit',
        label: '途中运输',
        status: 'abnormal',
        startTime: '2024-06-15 02:00:00',
        endTime: '2024-06-15 07:20:00',
        avgTemp: -12.5,
        tempRange: [-19.0, -8.5],
        abnormalCount: 3,
        abnormalSegments: [
          {
            id: 'ABN003',
            startTime: '2024-06-15 03:10:00',
            endTime: '2024-06-15 03:50:00',
            durationMinutes: 40,
            maxTemp: -10.5,
            minTemp: -15.0,
            avgTemp: -12.5,
            carrierRemark: '制冷机组故障，临时检修'
          },
          {
            id: 'ABN004',
            startTime: '2024-06-15 05:30:00',
            endTime: '2024-06-15 06:10:00',
            durationMinutes: 40,
            maxTemp: -9.8,
            minTemp: -14.2,
            avgTemp: -11.8,
            carrierRemark: '等待维修人员到场，机组未运行'
          },
          {
            id: 'ABN005',
            startTime: '2024-06-15 06:30:00',
            endTime: '2024-06-15 07:00:00',
            durationMinutes: 30,
            maxTemp: -8.5,
            minTemp: -13.5,
            avgTemp: -10.5,
            carrierRemark: '维修后机组恢复，但温度回升明显'
          }
        ]
      },
      {
        type: 'arrival',
        label: '到店开门',
        status: 'warning',
        startTime: '2024-06-15 07:20:00',
        endTime: '2024-06-15 07:50:00',
        avgTemp: -14.0,
        tempRange: [-16.0, -12.0],
        abnormalCount: 0,
        abnormalSegments: []
      }
    ],
    'WB20240615004': [
      {
        type: 'loading',
        label: '装车阶段',
        status: 'normal',
        startTime: '2024-06-15 03:00:00',
        endTime: '2024-06-15 04:00:00',
        avgTemp: -22.5,
        tempRange: [-24.0, -21.0],
        abnormalCount: 0,
        abnormalSegments: []
      },
      {
        type: 'transit',
        label: '途中运输',
        status: 'normal',
        startTime: '2024-06-15 04:00:00',
        endTime: '2024-06-15 10:00:00',
        avgTemp: -21.8,
        tempRange: [-23.5, -20.0],
        abnormalCount: 0,
        abnormalSegments: []
      },
      {
        type: 'arrival',
        label: '到店开门',
        status: 'normal',
        startTime: '2024-06-15 10:00:00',
        endTime: '2024-06-15 10:30:00',
        avgTemp: -20.5,
        tempRange: [-22.0, -19.0],
        abnormalCount: 0,
        abnormalSegments: []
      }
    ]
  }

  return baseNodes[waybillId] || baseNodes['WB20240615001']
}

export const findWaybillByNo = (waybillNo: string): WaybillInfo | undefined => {
  return mockWaybills.find(w => w.waybillNo === waybillNo)
}

export const findWaybillById = (id: string): WaybillInfo | undefined => {
  return mockWaybills.find(w => w.id === id)
}

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
    productCount: 120,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪A·88F29',
    driverName: '张建国',
    actualArrival: '2024-06-15 09:15:00',
    overallStatus: 'warning',
    tempNodes: generateTempNodes('WB20240615001'),
    totalAbnormalMinutes: 51,
    conclusion: 'accepted',
    receiverName: '李明',
    boxCountExpected: 120,
    boxCountActual: 120,
    boxDiff: 0,
    photos: [
      'https://picsum.photos/id/292/600/400',
      'https://picsum.photos/id/312/600/400'
    ],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-15 09:30:00',
    remark: '途中温度略有偏高，时间不长，货品状态良好',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-15 09:32:00',
    syncedAt: '2024-06-15 09:32:05',
    createdAt: '2024-06-15 09:32:00',
    abnormalReviews: [
      {
        segmentId: 'ABN001',
        appearance: 'normal',
        supplementPhotos: [],
        reviewNote: '外观检查无异常，货品保持冷冻状态',
        reviewedAt: '2024-06-15 09:22:00',
        reviewerName: '李明'
      }
    ],
    hqCallback: {
      confirmNo: 'HQ20240615-00892',
      confirmedAt: '2024-06-15 10:15:00',
      handlerName: '陈主管',
      handlingOpinion: '温度波动在允许范围内，货品状态良好，同意正常入库',
      finalDisposition: 'accepted',
      finalDispositionNote: '全部正常接收，无异常处理',
      disposedAt: '2024-06-15 10:15:00'
    }
  },
  {
    id: 'REC002',
    waybillId: 'WB20240614003',
    waybillNo: 'CC-20240614-00756',
    productName: '冷鲜牛肉片',
    productCount: 80,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪B·35K61',
    driverName: '李志强',
    actualArrival: '2024-06-14 10:20:00',
    overallStatus: 'normal',
    tempNodes: generateTempNodes('WB20240615002'),
    totalAbnormalMinutes: 0,
    conclusion: 'accepted',
    receiverName: '李明',
    boxCountExpected: 80,
    boxCountActual: 80,
    boxDiff: 0,
    photos: ['https://picsum.photos/id/431/600/400'],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-14 10:40:00',
    remark: '',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-14 10:45:00',
    syncedAt: '2024-06-14 10:45:03',
    createdAt: '2024-06-14 10:45:00',
    abnormalReviews: [],
    hqCallback: {
      confirmNo: 'HQ20240614-00756',
      confirmedAt: '2024-06-14 11:30:00',
      handlerName: '陈主管',
      handlingOpinion: '温度全程达标，同意正常入库',
      finalDisposition: 'accepted',
      finalDispositionNote: '全部正常接收',
      disposedAt: '2024-06-14 11:30:00'
    }
  },
  {
    id: 'REC003',
    waybillId: 'WB20240614002',
    waybillNo: 'CC-20240614-00634',
    productName: '冻虾仁（26/30）',
    productCount: 200,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪C·77M12',
    driverName: '王海军',
    actualArrival: '2024-06-14 07:45:00',
    overallStatus: 'abnormal',
    tempNodes: generateTempNodes('WB20240615003'),
    totalAbnormalMinutes: 110,
    conclusion: 'pending_supervisor',
    receiverName: '李明',
    boxCountExpected: 200,
    boxCountActual: 198,
    boxDiff: -2,
    photos: [
      'https://picsum.photos/id/326/600/400',
      'https://picsum.photos/id/570/600/400'
    ],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-14 08:08:00',
    remark: '途中温度超标持续1小时20分，部分货品有软化迹象，短少2箱，已上报主管',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-14 08:10:00',
    syncedAt: '2024-06-14 08:10:08',
    createdAt: '2024-06-14 08:10:00',
    abnormalReviews: [
      {
        segmentId: 'ABN003',
        appearance: 'slight_soft',
        supplementPhotos: ['https://picsum.photos/id/326/600/400'],
        reviewNote: '货品表面轻微结霜融化，手感偏软，但未完全解冻',
        reviewedAt: '2024-06-14 07:58:00',
        reviewerName: '李明'
      },
      {
        segmentId: 'ABN004',
        appearance: 'obvious_soft',
        supplementPhotos: ['https://picsum.photos/id/570/600/400'],
        reviewNote: '部分虾仁包装有明显水珠，外箱底部有湿痕',
        reviewedAt: '2024-06-14 07:59:00',
        reviewerName: '李明'
      }
    ],
    hqCallback: {
      confirmNo: 'HQ20240614-00634',
      confirmedAt: '2024-06-14 09:30:00',
      handlerName: '王经理',
      handlingOpinion: '温度超标时间较长，需进一步评估货品质量。已联系品控部门确认。',
      finalDisposition: 'partial_rejected',
      finalDispositionNote: '确认拒收软化严重的5箱，其余193箱打折入库处理。短少2箱由承运方赔付。',
      disposedAt: '2024-06-14 14:20:00'
    }
  },
  {
    id: 'REC004',
    waybillId: 'WB20240613005',
    waybillNo: 'CC-20240613-00921',
    productName: '冷藏蔬菜组合包',
    productCount: 60,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪A·12A34',
    driverName: '赵德胜',
    actualArrival: '2024-06-13 08:30:00',
    overallStatus: 'normal',
    tempNodes: generateTempNodes('WB20240615004'),
    totalAbnormalMinutes: 0,
    conclusion: 'accepted',
    receiverName: '王芳',
    boxCountExpected: 60,
    boxCountActual: 60,
    boxDiff: 0,
    photos: ['https://picsum.photos/id/580/600/400'],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-13 08:52:00',
    remark: '',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-13 08:55:00',
    syncedAt: '2024-06-13 08:55:02',
    createdAt: '2024-06-13 08:55:00',
    abnormalReviews: []
  },
  {
    id: 'REC005',
    waybillId: 'WB20240613003',
    waybillNo: 'CC-20240613-00587',
    productName: '冻鸡腿肉',
    productCount: 150,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪B·56B78',
    driverName: '张建国',
    actualArrival: '2024-06-13 06:50:00',
    overallStatus: 'normal',
    tempNodes: generateTempNodes('WB20240615002'),
    totalAbnormalMinutes: 0,
    conclusion: 'accepted',
    receiverName: '李明',
    boxCountExpected: 149,
    boxCountActual: 150,
    boxDiff: 1,
    photos: ['https://picsum.photos/id/625/600/400'],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-13 07:12:00',
    remark: '实收多1箱，司机确认补发',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-13 07:15:00',
    syncedAt: '2024-06-13 07:15:06',
    createdAt: '2024-06-13 07:15:00',
    abnormalReviews: []
  },
  {
    id: 'REC006',
    waybillId: 'WB20240612004',
    waybillNo: 'CC-20240612-00812',
    productName: '冰淇淋（多口味）',
    productCount: 150,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪A·99G88',
    driverName: '赵德胜',
    actualArrival: '2024-06-12 09:00:00',
    overallStatus: 'warning',
    tempNodes: generateTempNodes('WB20240615001'),
    totalAbnormalMinutes: 45,
    conclusion: 'partial_rejected',
    receiverName: '王芳',
    boxCountExpected: 150,
    boxCountActual: 147,
    boxDiff: -3,
    photos: [
      'https://picsum.photos/id/835/600/400',
      'https://picsum.photos/id/1080/600/400'
    ],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-12 09:28:00',
    remark: '3箱草莓口味冰淇淋软化变形，拒收，其余正常',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-12 09:30:00',
    syncedAt: '2024-06-12 09:30:10',
    createdAt: '2024-06-12 09:30:00',
    abnormalReviews: [],
    hqCallback: {
      confirmNo: 'HQ20240612-00812',
      confirmedAt: '2024-06-12 11:00:00',
      handlerName: '陈主管',
      handlingOpinion: '门店已做部分拒收处理，3箱损坏货品由承运方承担。',
      finalDisposition: 'partial_rejected',
      finalDispositionNote: '已确认部分拒收，损坏货品从运费中扣除',
      disposedAt: '2024-06-12 11:00:00'
    }
  },
  {
    id: 'REC007',
    waybillId: 'WB20240612001',
    waybillNo: 'CC-20240612-00423',
    productName: '冷鲜三文鱼',
    productCount: 40,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪B·35K61',
    driverName: '李志强',
    actualArrival: '2024-06-12 07:20:00',
    overallStatus: 'normal',
    tempNodes: generateTempNodes('WB20240615004'),
    totalAbnormalMinutes: 0,
    conclusion: 'accepted',
    receiverName: '李明',
    boxCountExpected: 40,
    boxCountActual: 40,
    boxDiff: 0,
    photos: ['https://picsum.photos/id/401/600/400'],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-12 07:38:00',
    remark: '',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-12 07:40:00',
    syncedAt: '2024-06-12 07:40:03',
    createdAt: '2024-06-12 07:40:00',
    abnormalReviews: []
  },
  {
    id: 'REC008',
    waybillId: 'WB20240611006',
    waybillNo: 'CC-20240611-00768',
    productName: '冻水饺（猪肉白菜）',
    productCount: 100,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪C·77M12',
    driverName: '王海军',
    actualArrival: '2024-06-11 08:15:00',
    overallStatus: 'normal',
    tempNodes: generateTempNodes('WB20240615002'),
    totalAbnormalMinutes: 0,
    conclusion: 'accepted',
    receiverName: '王芳',
    boxCountExpected: 100,
    boxCountActual: 100,
    boxDiff: 0,
    photos: ['https://picsum.photos/id/292/600/400'],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-11 08:33:00',
    remark: '',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-11 08:35:00',
    syncedAt: '2024-06-11 08:35:02',
    createdAt: '2024-06-11 08:35:00',
    abnormalReviews: []
  },
  {
    id: 'REC009',
    waybillId: 'WB20240611002',
    waybillNo: 'CC-20240611-00345',
    productName: '冷藏鲜奶',
    productCount: 80,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪A·88F29',
    driverName: '张建国',
    actualArrival: '2024-06-11 06:40:00',
    overallStatus: 'normal',
    tempNodes: generateTempNodes('WB20240615004'),
    totalAbnormalMinutes: 0,
    conclusion: 'accepted',
    receiverName: '李明',
    boxCountExpected: 80,
    boxCountActual: 80,
    boxDiff: 0,
    photos: ['https://picsum.photos/id/312/600/400'],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-11 06:58:00',
    remark: '',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-11 07:00:00',
    syncedAt: '2024-06-11 07:00:01',
    createdAt: '2024-06-11 07:00:00',
    abnormalReviews: []
  },
  {
    id: 'REC010',
    waybillId: 'WB20240610004',
    waybillNo: 'CC-20240610-00678',
    productName: '冻鸡翅中',
    productCount: 180,
    unit: '箱',
    warehouse: '上海冷链中心仓（青浦）',
    vehicleNo: '沪C·77M12',
    driverName: '王海军',
    actualArrival: '2024-06-10 08:50:00',
    overallStatus: 'abnormal',
    tempNodes: generateTempNodes('WB20240615003'),
    totalAbnormalMinutes: 120,
    conclusion: 'pending_supervisor',
    receiverName: '王芳',
    boxCountExpected: 180,
    boxCountActual: 180,
    boxDiff: 0,
    photos: [
      'https://picsum.photos/id/326/600/400'
    ],
    driverSignature: 'https://picsum.photos/id/1025/600/200',
    driverConfirmed: true,
    driverConfirmedAt: '2024-06-10 09:13:00',
    remark: '全程温度偏高，货品已部分解冻，等待主管确认处理方案',
    syncStatus: 'synced',
    syncAttempts: 1,
    submittedAt: '2024-06-10 09:15:00',
    syncedAt: '2024-06-10 09:15:05',
    createdAt: '2024-06-10 09:15:00',
    abnormalReviews: [
      {
        segmentId: 'ABN003',
        appearance: 'thawed',
        supplementPhotos: ['https://picsum.photos/id/326/600/400'],
        reviewNote: '外箱明显潮湿，鸡翅表面有明显水珠，已完全解冻',
        reviewedAt: '2024-06-10 09:02:00',
        reviewerName: '王芳'
      }
    ],
    hqCallback: {
      confirmNo: 'HQ20240610-00678',
      confirmedAt: '2024-06-10 10:00:00',
      handlerName: '王经理',
      handlingOpinion: '全程温度超标严重，货品已全部解冻，存在食品安全风险，作退回处理。',
      finalDisposition: 'returned',
      finalDispositionNote: '全部退回，运费由承运方承担，已通知司机原车带回',
      disposedAt: '2024-06-10 10:30:00'
    }
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

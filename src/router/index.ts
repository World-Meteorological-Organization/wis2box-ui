import { createRouter, createWebHistory } from 'vue-router'
import Datasets from '@/views/DatasetView.vue'
import Services from '@/views/ServiceView.vue'
import SynopMapView from '@/views/SynopMapView.vue'
import ChartDialog from '@/components/ChartDialog.vue'
import TempMapView from '@/views/TempMapView.vue'

const Authorize = {
  template: "<div>{{ $t('messages.authorize') }}</div>",
}

const routes = [
  {
    path: '/fixed-land-station-map/:topic',
    props: true,
    name: 'Synop Map',
    component: SynopMapView,
  },
  {
    path: '/fixed-land-station-map/:topic/data',
    props: true,
    name: 'Synop Data',
    component: ChartDialog,
  },
    {
    path: '/fixed-upper-air-map/:metadata_id',
    props: true,
    name: 'Temp Map',
    component: TempMapView,
  },
  {
    path: '/',
    name: 'Datasets',
    component: Datasets,
  },
  {
    path: '/services',
    name: 'Services',
    component: Services,
  },
  {
    path: '/authorize',
    name: 'Authorize',
    component: Authorize,
  },
  {
    path: '/:path',
    name: 'Not Found',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

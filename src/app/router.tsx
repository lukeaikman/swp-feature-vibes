import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'
import Dashboard from '../pages/Dashboard/Dashboard'
import Onboarding from '../pages/Onboarding/Onboarding'

export const AppRouter = () => (
  <Routes>
    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
    <Route path={ROUTES.ONBOARDING} element={<Onboarding />} />
    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} />} />
  </Routes>
)

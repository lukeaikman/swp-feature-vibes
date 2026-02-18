import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'
import Dashboard from '../pages/Dashboard/Dashboard'

export const AppRouter = () => (
  <Routes>
    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
    {/* Add module routes here, e.g.:
    <Route path={ROUTES.TEMPLATES} element={<TemplatesList />} />
    <Route path={ROUTES.CREATE_TEMPLATE} element={<TemplateForm />} />
    <Route path="/templates/:id" element={<TemplateDetail />} />
    */}
    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} />} />
  </Routes>
)

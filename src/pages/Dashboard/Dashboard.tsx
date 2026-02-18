import React from 'react'
import { PageContainer, PageHeader, ContentBox, Text } from '@UI'
import { useTheme } from '@material-ui/core/styles'

const Dashboard = () => {
  const theme = useTheme()

  return (
    <PageContainer breadcrumbs={[{ label: 'Dashboard' }]}>
      <PageHeader title="Welcome to Your Module" />

      <ContentBox>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>
          This is your starting point. The template is working correctly if you can see this page
          with the SWP theme applied.
        </Text>
        <Text style={{ fontSize: 14, color: theme.palette.gray.main }}>
          Start building by creating your entities in <code>src/entities/</code>, adding pages in{' '}
          <code>src/pages/</code>, and documenting everything in the three living documents.
        </Text>
      </ContentBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
        <ContentBox>
          <Text style={{ fontWeight: 700, marginBottom: 4, color: theme.palette.brand.main }}>
            FEATURE-DEVELOPER-GUIDE.md
          </Text>
          <Text style={{ fontSize: 13 }}>
            How to work with components, routing, mock API, types, and forms.
          </Text>
        </ContentBox>
        <ContentBox>
          <Text style={{ fontWeight: 700, marginBottom: 4, color: theme.palette.brand.main }}>
            API-CONTRACT.md
          </Text>
          <Text style={{ fontSize: 13 }}>
            Document every endpoint your module calls. The backend team builds from this.
          </Text>
        </ContentBox>
        <ContentBox>
          <Text style={{ fontWeight: 700, marginBottom: 4, color: theme.palette.brand.main }}>
            CHANGELOG.md
          </Text>
          <Text style={{ fontSize: 13 }}>
            Record what you built, why, and any decisions or known issues.
          </Text>
        </ContentBox>
      </div>
    </PageContainer>
  )
}

export default Dashboard

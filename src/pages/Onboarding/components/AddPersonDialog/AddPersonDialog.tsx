import React, { useState } from 'react'
import { Modal, Input, Button, Text } from '@UI'
import { useCreateUser } from '../../../../entities/onboarding'
import type { IUser } from '../../../../types'
import { Roles } from '../../../../types'

interface AddPersonDialogProps {
  isOpen: boolean
  onClose: () => void
  onPersonCreated: (person: IUser) => void
}

export const AddPersonDialog = ({ isOpen, onClose, onPersonCreated }: AddPersonDialogProps) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createUser = useCreateUser()

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format'
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      const person = await createUser.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        roles: [Roles.USER],
        language: 'en',
        isDeleted: false,
      })
      onPersonCreated(person as IUser)
      resetForm()
      onClose()
    } catch {
      setErrors({ submit: 'Failed to create person. Please try again.' })
    }
  }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhoneNumber('')
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} close={handleClose} title="Add New Person">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 500 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="First Name *"
            fullWidth
            value={firstName}
            onChange={(e) => setFirstName((e.target as HTMLInputElement).value)}
            errors={errors.firstName ? [errors.firstName] : undefined}
          />
          <Input
            label="Last Name *"
            fullWidth
            value={lastName}
            onChange={(e) => setLastName((e.target as HTMLInputElement).value)}
            errors={errors.lastName ? [errors.lastName] : undefined}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Email *"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            errors={errors.email ? [errors.email] : undefined}
          />
          <Input
            label="Phone Number *"
            type="tel"
            fullWidth
            value={phoneNumber}
            onChange={(e) => setPhoneNumber((e.target as HTMLInputElement).value)}
            errors={errors.phoneNumber ? [errors.phoneNumber] : undefined}
          />
        </div>

        {errors.submit && (
          <Text style={{ color: '#d32f2f', fontSize: 14 }}>{errors.submit}</Text>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending ? 'Saving...' : 'Add Person'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AddPersonDialog

import React from 'react';
import { UserRole, Student, ClassInfo } from '../types';
import { LoginScreen } from './LoginScreen';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  students: Student[];
  currentClass: ClassInfo;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  onSelectRole,
  students,
  currentClass
}) => {
  if (!isOpen) return null;

  return (
    <LoginScreen
      currentClass={currentClass}
      students={students}
      onLoginSuccess={(role) => {
        onSelectRole(role);
        onClose();
      }}
      isModal={true}
      onCloseModal={onClose}
    />
  );
};

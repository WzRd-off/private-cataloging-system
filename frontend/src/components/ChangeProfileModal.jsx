import { useState, useEffect } from 'react';
import { profileAPI } from '../services/profile';
import { IconCheck, IconClose } from '../components/icons';

const ChangeProfileModal = ({ user, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setFormData({ 
                name: user.name || '', 
                email: user.email || '', 
                phone: user.phone || '' 
            });
        }
    }, [isOpen, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await profileAPI.updateProfile(formData.name, formData.email, formData.phone);
            const updatedUser = response.user ?? response;
            onUpdate(updatedUser);
            onClose();
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Помилка оновлення профілю. Спробуйте ще раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* Використовуємо клас .modal з index.css */}
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <IconClose size={18} />
                </button>

                <h2>Редагувати профіль</h2>
                <p className="modal-sub">Оновіть свою контактну інформацію</p>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="modal-fg">
                        <label htmlFor="modal-name">Ім'я</label>
                        <input
                            id="modal-name"
                            className="modal-input"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ваше ім'я"
                            required
                        />
                    </div>

                    <div className="modal-fg">
                        <label htmlFor="modal-email">Email</label>
                        <input
                            id="modal-email"
                            className="modal-input"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@mail.com"
                            required
                        />
                    </div>

                    <div className="modal-fg">
                        <label htmlFor="modal-phone">Телефон</label>
                        <input
                            id="modal-phone"
                            className="modal-input"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+380 XX XXX XX XX"
                        />
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="submit" 
                            className="btn btn-save" 
                            disabled={isSubmitting}
                        >
                            <IconCheck /> {isSubmitting ? 'Збереження...' : 'Зберегти'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-ghost" 
                            onClick={onClose}
                        >
                            Скасувати
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeProfileModal;
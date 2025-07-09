import React, { useEffect, useRef, useState } from 'react';
import Modal from 'bootstrap/js/dist/modal';

const InvoiceFilterModal = ({ filters, setFilters, persons, onApply, onReset }) => {
    const modalRef = useRef(null);
    const dialogRef = useRef(null);
    const [isDragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const modal = new Modal(modalRef.current);
        modal.show();

        return () => {
            modal.hide();
            document.body.classList.remove('modal-open');
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        };
    }, []);

    const startDrag = (e) => {
        setDragging(true);
        const rect = dialogRef.current.getBoundingClientRect();
        setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const onDrag = (e) => {
        if (isDragging) {
            dialogRef.current.style.left = `${e.clientX - offset.x}px`;
            dialogRef.current.style.top = `${e.clientY - offset.y}px`;
        }
    };

    const endDrag = () => setDragging(false);

    useEffect(() => {
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", endDrag);
        return () => {
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", endDrag);
        };
    });

    const handleChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="modal fade show" ref={modalRef} tabIndex="-1" style={{ display: 'block' }}>
            <div
                className="modal-dialog draggable-modal"
                ref={dialogRef}
            >
                <div className="modal-content">
                    <div className="modal-header" onMouseDown={startDrag}>
                        <h5 className="modal-title">Filtr faktur</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Zavřít"></button>
                    </div>
                    <div className="modal-body">
                        {/* obsah filtrů beze změny */}
                        <select name="buyerId" className="form-select mb-2" value={filters.buyerId} onChange={handleChange}>
                            <option value="">Vyberte kupujícího</option>
                            {persons.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                        <select name="sellerId" className="form-select mb-2" value={filters.sellerId} onChange={handleChange}>
                            <option value="">Vyberte prodávajícího</option>
                            {persons.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                        <input name="product" className="form-control mb-2" placeholder="Produkt" value={filters.product} onChange={handleChange} />
                        <input name="minPrice" className="form-control mb-2" placeholder="Min. cena" value={filters.minPrice} onChange={handleChange} />
                        <input name="maxPrice" className="form-control mb-2" placeholder="Max. cena" value={filters.maxPrice} onChange={handleChange} />
                        <input name="limit" className="form-control mb-2" placeholder="Limit" value={filters.limit} onChange={handleChange} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onReset}>Zrušit</button>
                        <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={onApply}>Použít filtr</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceFilterModal;

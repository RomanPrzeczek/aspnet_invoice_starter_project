// components/invoices/InvoiceFilterBar.jsx
import PropTypes from 'prop-types';
import {useTranslation} from "react-i18next";

const InvoiceFilterBar = ({ filters, setFilters, persons, onApply, filterActive, onClear }) => {
    const {t} = useTranslation();
    const handleChange = (e) => {
        setFilters((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onApply();
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-light border rounded mb-4">
            <div className="row g-2 align-items-end">
                <div className="col">
                    <label className="form-label">{t('Seller')}</label>
                    <select
                        name="sellerId"
                        className="form-select"
                        value={filters.sellerId}
                        onChange={handleChange}
                    >
                        <option value="">{t('AllTogether')}</option>
                        {persons.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label className="form-label">{t('Buyer')}</label>
                    <select
                        name="buyerId"
                        className="form-select"
                        value={filters.buyerId}
                        onChange={handleChange}
                    >
                        <option value="">{t('AllTogether')}</option>
                        {persons.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label className="form-label">{t('Product')}</label>
                    <input
                        name="product"
                        className="form-control"
                        value={filters.product}
                        onChange={handleChange}
                    />
                </div>

                <div className="col">
                    <label className="form-label">{t('MinPrice')}</label>
                    <input
                        name="minPrice"
                        type="number"
                        className="form-control"
                        value={filters.minPrice}
                        onChange={handleChange}
                    />
                </div>

                <div className="col">
                    <label className="form-label">{t('MaxPrice')}</label>
                    <input
                        name="maxPrice"
                        type="number"
                        className="form-control"
                        value={filters.maxPrice}
                        onChange={handleChange}
                    />
                </div>

                <div className="col">
                    <label className="form-label">Limit</label>
                    <input
                        name="limit"
                        type="number"
                        className="form-control"
                        value={filters.limit}
                        onChange={handleChange}
                    />
                </div>

                <div className="col-auto d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                        {filterActive ? t('Filtered')+" 🔍" : t('Filter')}
                    </button>
                    {filterActive && (
                        <button type="button" className="btn btn-outline-secondary" onClick={onClear}>
                            {t('RemoveFilter')} 
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
};

InvoiceFilterBar.propTypes = {
    filters: PropTypes.object.isRequired,
    setFilters: PropTypes.func.isRequired,
    persons: PropTypes.array.isRequired,
    filterActive: PropTypes.bool.isRequired,
    onApply: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
};

export default InvoiceFilterBar;
// components/invoices/InvoiceFilterBar.jsx
import PropTypes from 'prop-types';

const InvoiceFilterBar = ({ filters, setFilters, persons, onApply, filterActive, onClear }) => {
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
                    <label className="form-label">Dodavatel</label>
                    <select
                        name="sellerId"
                        className="form-select"
                        value={filters.sellerId}
                        onChange={handleChange}
                    >
                        <option value="">Všichni</option>
                        {persons.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label className="form-label">Odběratel</label>
                    <select
                        name="buyerId"
                        className="form-select"
                        value={filters.buyerId}
                        onChange={handleChange}
                    >
                        <option value="">Všichni</option>
                        {persons.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="col">
                    <label className="form-label">Produkt</label>
                    <input
                        name="product"
                        className="form-control"
                        value={filters.product}
                        onChange={handleChange}
                    />
                </div>

                <div className="col">
                    <label className="form-label">Min. cena</label>
                    <input
                        name="minPrice"
                        type="number"
                        className="form-control"
                        value={filters.minPrice}
                        onChange={handleChange}
                    />
                </div>

                <div className="col">
                    <label className="form-label">Max. cena</label>
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
                        {filterActive ? "Filtrováno 🔍" : "Filtrovat"}
                    </button>
                    {filterActive && (
                        <button type="button" className="btn btn-outline-secondary" onClick={onClear}>
                            Zrušit filtr
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
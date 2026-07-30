import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';

interface CartMarkerIconProps {
  status: 'paid' | 'pending';
}

const CartMarkerIconContent: React.FC<CartMarkerIconProps> = ({ status }) => {
  const color = status === 'paid' ? '#10b981' : '#f43f5e';
  const shadow = status === 'paid'
    ? '0 0 12px rgba(16,185,129,0.6)'
    : '0 0 12px rgba(244,63,94,0.6)';

  return (
    <div
      style={{
        backgroundColor: color,
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid white',
        boxShadow: shadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        cursor: 'pointer',
      }}
    >
      🛒
    </div>
  );
};

function buildCartIcon(status: 'paid' | 'pending'): L.DivIcon {
  const html = renderToStaticMarkup(<CartMarkerIconContent status={status} />);
  return L.divIcon({
    className: 'custom-cart-marker',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export const iconPaid = buildCartIcon('paid');
export const iconPending = buildCartIcon('pending');

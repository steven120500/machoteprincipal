import { Toaster } from "react-hot-toast";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
// 1. Importamos los componentes de navegación
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import AddProductModal from "./components/AddProductModal";
import LoginModal from "./components/LoginModal";
import RegisterUserModal from "./components/RegisterUserModal";
import Footer from "./components/Footer";
import LoadingOverlay from "./components/LoadingOverlay";
import tallaPorTipo from "./utils/tallaPorTipo";
import { FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import TopBanner from "./components/TopBanner";
import UserListModal from "./components/UserListModal";
import HistoryModal from "./components/HistoryModal";
import Medidas from "./components/Medidas";
import Bienvenido from "./components/Bienvenido";
import FilterBar from "./components/FilterBar";

// 2. Importamos la nueva página de Reset Password
import ResetPassword from "./pages/ResetPassword";

const API_BASE = "https://machoteprincipal.onrender.com"; 
const GOLD = "#9E8F91";

function buildPages(page, pages) {
  const out = new Set([1, pages, page, page - 1, page - 2, page + 1, page + 2]);
  return [...out].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

const getPid = (p) => String(p?._id ?? p?.id ?? "");

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSizes, setFilterSizes] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMedidas, setShowMedidas] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageTopRef = useRef(null);
  const isFirstRun = useRef(true);

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const isSuperUser = user?.isSuperUser || false;
  const canSeeHistory = user?.isSuperUser || user?.roles?.includes("history");
  const canAdd = user?.isSuperUser || user?.roles?.includes("add");
  const canEdit = user?.isSuperUser || user?.roles?.includes("edit");
  const canDelete = user?.isSuperUser || user?.roles?.includes("delete");

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Sesión cerrada correctamente");
  };

  const fetchProducts = async (opts = {}) => {
    const p = opts.page ?? page;
    const q = (opts.q ?? searchTerm).trim();
    const tp = (opts.type ?? filterType).trim();
    const sizes = (opts.sizes ?? filterSizes).join(",");
    const mode = opts.mode ?? (window.__verDisponiblesActivo ? "disponibles" : "");

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "20",
        ...(q ? { q } : {}),
        ...(tp ? { type: tp } : {}),
        ...(sizes ? { sizes } : {}),
        ...(mode ? { mode } : {}),
      });

      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      setProducts(json.items);
      setTotal(json.total);
      setPage(json.page);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts({ page, q: searchTerm, type: filterType, sizes: filterSizes });
    if (isFirstRun.current) {
      window.scrollTo(0, 0);
      isFirstRun.current = false;
    } else {
      if (pageTopRef.current) {
        const rect = pageTopRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop;
        window.scrollTo({ top: targetY - 120, behavior: "smooth" });
      }
    }
  }, [page, searchTerm, filterType, filterSizes]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleCarruselFilter = (categoria) => {
      delete window.__verDisponiblesActivo;
      setFilterType(categoria);
      setSearchTerm("");
      setPage(1);
      fetchProducts({ page: 1, type: categoria });
      setTimeout(() => {
        if (pageTopRef.current) {
          const y = pageTopRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y - 323, behavior: "smooth" });
        }
      }, 300);
    };
    const onRetros = () => handleCarruselFilter("Retro");
    const onPlayer = () => handleCarruselFilter("Player");
    const onFan = () => handleCarruselFilter("Fan");
    const onNacional = () => handleCarruselFilter("Nacional");
    window.addEventListener("filtrarRetros", onRetros);
    window.addEventListener("filtrarPlayer", onPlayer);
    window.addEventListener("filtrarFan", onFan);
    window.addEventListener("filtrarNacional", onNacional);
    return () => {
      window.removeEventListener("filtrarRetros", onRetros);
      window.removeEventListener("filtrarPlayer", onPlayer);
      window.removeEventListener("filtrarFan", onFan);
      window.removeEventListener("filtrarNacional", onNacional);
    };
  }, []);

  useEffect(() => {
    const handleFiltrarOfertas = () => {
      delete window.__verDisponiblesActivo;
      setFilterType("Ofertas");
      setPage(1);
      fetchProducts({ page: 1, type: "Ofertas" });
      setTimeout(() => {
        if (pageTopRef.current) {
          const y = pageTopRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y - 150, behavior: "smooth" });
        }
      }, 400);
    };
    window.addEventListener("filtrarOfertas", handleFiltrarOfertas);
    return () => window.removeEventListener("filtrarOfertas", handleFiltrarOfertas);
  }, []);

  useEffect(() => {
    const handleFiltrarDisponibles = async () => {
      window.__verDisponiblesActivo = true;
      setFilterType("");
      setSearchTerm("");
      setPage(1);
      await fetchProducts({ page: 1, mode: "disponibles" });
      setTimeout(() => {
        if (pageTopRef.current) {
          const y = pageTopRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y - 100, behavior: "smooth" });
        }
      }, 400);
    };
    window.addEventListener("filtrarDisponibles", handleFiltrarDisponibles);
    return () => {
      delete window.__verDisponiblesActivo;
      window.removeEventListener("filtrarDisponibles", handleFiltrarDisponibles);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("product");
    if (!pid) return;
    const match = products.find((p) => String(p._id) === pid || String(p.id) === pid);
    if (match) {
      setSelectedProduct(match);
      return;
    }
    fetch(`${API_BASE}/api/products/${pid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data._id) setSelectedProduct(data);
      })
      .catch(() => {});
  }, [products]);

  const handleProductUpdate = (updatedProduct, deletedId = null) => {
    if (deletedId) {
      setProducts((prev) => prev.filter((p) => getPid(p) !== String(deletedId)));
      setSelectedProduct(null);
      toast.success("Producto eliminado correctamente");
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        getPid(p) === getPid(updatedProduct) ? { ...p, ...updatedProduct } : p
      )
    );
    toast.success("Producto actualizado correctamente");
  };

  const normalize = (str) =>
    str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProducts = products.filter((product) => {
    const name = normalize(product.name || "");
    const matchesSearch = name.includes(normalize(searchTerm || ""));
    const hasStock = Object.values(product.stock || {}).some((qty) => Number(qty) > 0);
    const price = Number(product.price ?? 0);
    const dpRaw = product.discountPrice;
    const dp = dpRaw === null || dpRaw === undefined ? null : Number(dpRaw);
    const isOffer = Number.isFinite(dp) && dp > 0 && dp < price;
    if (filterType === "Ofertas") return matchesSearch && isOffer;
    if (window.__verDisponiblesActivo) {
      const noDiscount = !Number.isFinite(dp) || dp <= 0 || dp >= price;
      return matchesSearch && hasStock && noDiscount;
    }
    if (filterType) {
      const productType = normalize(product.type || "");
      const filter = normalize(filterType);
      return matchesSearch && productType.includes(filter);
    }
    return matchesSearch;
  });

  return (
    <Router>
      <Routes>
        {/* 🛡️ RUTA DE RECUPERACIÓN: Se muestra en una página limpia */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 🏠 RUTA PRINCIPAL: Contiene toda tu tienda */}
        <Route path="/" element={
          <>
            {showRegisterUserModal && (
              <RegisterUserModal onClose={() => setShowRegisterUserModal(false)} />
            )}

            {showUserListModal && (
              <UserListModal
                open={showUserListModal}
                onClose={() => setShowUserListModal(false)}
              />
            )}

            {showHistoryModal && (
              <HistoryModal
                open={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                isSuperUser={user?.isSuperUser === true}
                roles={user?.roles || []}
              />
            )}

            {showMedidas && (
              <Medidas
                open={showMedidas}
                onClose={() => setShowMedidas(false)}
                currentType={filterType || "Todos"}
              />
            )}

            {loading && <LoadingOverlay message="Cargando productos..." />}

            <div className="fixed top-0 left-0 w-full z-50">
              <TopBanner />
              {!selectedProduct &&
                !showAddModal &&
                !showLogin &&
                !showRegisterUserModal &&
                !showUserListModal &&
                !showHistoryModal &&
                !showMedidas && (
                  <Header
                    onLoginClick={() => setShowLogin(true)}
                    onLogout={handleLogout}
                    onLogoClick={() => {
                      setFilterType("");
                      setSearchTerm("");
                      setPage(1);
                    }}
                    onMedidasClick={() => setShowMedidas(true)}
                    user={user}
                    isSuperUser={isSuperUser}
                    canSeeHistory={canSeeHistory}
                    setShowRegisterUserModal={setShowRegisterUserModal}
                    setShowUserListModal={setShowUserListModal}
                    setShowHistoryModal={setShowHistoryModal}
                    setFilterType={setFilterType}
                  />
                )}
            </div>

            <div className="h-[120px]" />
            <Bienvenido />

            <FilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterType={filterType}
              setFilterType={setFilterType}
              filterSizes={filterSizes}
              setFilterSizes={setFilterSizes}
            />

            {canAdd && (
              <button
                className="fixed bottom-6 fondo-plateado right-6 text-black p-4 rounded-full shadow-lg transition z-50"
                onClick={() => setShowAddModal(true)}
                title="Añadir producto"
              >
                <FaPlus />
              </button>
            )}

            <div className="relative w-full">
              <div
                ref={pageTopRef}
                className="relative z-10 px-4 grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8"
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    canEdit={canEdit}
                    key={getPid(product)}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    user={user}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence>
              {selectedProduct && (
                <ProductModal
                  key={`${getPid(selectedProduct)}-${selectedProduct.updatedAt || ""}`}
                  product={selectedProduct}
                  onClose={() => setSelectedProduct(null)}
                  onUpdate={handleProductUpdate}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  user={user}
                />
              )}
            </AnimatePresence>

            {showAddModal && (
              <AddProductModal
                user={user}
                tallaPorTipo={tallaPorTipo}
                onAdd={(newProduct) => {
                  setProducts((prev) => [newProduct, ...prev]);
                  setShowAddModal(false);
                  toast.success("Producto agregado correctamente");
                }}
                onCancel={() => setShowAddModal(false)}
              />
            )}

            {showLogin && (
              <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onLoginSuccess={(userData) => {
                  setUser(userData);
                  localStorage.setItem("user", JSON.stringify(userData));
                  setShowLogin(false);
                  toast.success("Bienvenido");
                }}
                onRegisterClick={() =>
                  setTimeout(() => setShowRegisterUserModal(true), 100)
                }
              />
            )}

            {pages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <nav className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 text-sm text-black fondo-plateado rounded border disabled:opacity-50"
                  >
                    <FaChevronLeft />
                  </button>

                  {(() => {
                    const nums = buildPages(page, pages);
                    return nums.map((n, i) => {
                      const prev = nums[i - 1];
                      const showDots = i > 0 && n - prev > 1;
                      return (
                        <span key={n} className="flex">
                          {showDots && <span className="px-2">…</span>}
                          <button
                            onClick={() => setPage(n)}
                            className={`px-2 text-sm py-0.5 rounded border ${
                              n === page ? "text-black fondo-plateado" : "hover:bg-green-700"
                            }`}
                            style={{
                              backgroundColor: n === page ? GOLD : "transparent",
                              borderColor: n === page ? GOLD : "#ccc",
                            }}
                          >
                            {n}
                          </button>
                        </span>
                      );
                    });
                  })()}

                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-2 py-1 text-sm text-black fondo-plateado rounded border disabled:opacity-50"
                  >
                    <FaChevronRight />
                  </button>
                </nav>
              </div>
            )}

            <Footer />
            <ToastContainer />
            <Toaster position="top-center" reverseOrder={false} />
          </>
        } />
      </Routes>
    </Router>
  );
}
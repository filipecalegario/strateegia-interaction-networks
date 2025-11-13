import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initializeApp } from '../legacy/main.js';
import { logout } from '../legacy/core/auth.js';
import { stopPeriodicCheck } from '../legacy/core/periodicCheck.js';

function MainPage() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.title = 'redes de interação';
        const cleanup = initializeApp({
            onUnauthenticated: () => navigate('/', { replace: true }),
            locationSearch: location.search,
            autoUpdate: true,
        });

        return () => {
            stopPeriodicCheck();
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [navigate, location.search]);

    const handleLogout = () => {
        logout(() => navigate('/', { replace: true }));
    };

    return (
        <div className="main-page">
            <div className="container p-3 d-flex justify-content-end">
                <button type="button" className="btn btn-link p-0" onClick={handleLogout}>
                    logout
                </button>
            </div>
            <div className="container mt-2">
                <div className="row input-group mb-2">
                    <h3 id="applet-title" className="mb-0" />
                </div>
                <div className="row input-group mb-2" id="project-chooser">
                    <span className="col-3 input-group-text">jornada</span>
                    <select className="col-6 form-select" aria-label="Default select example" id="projects-list" />
                    <span className="col-3 input-group-text">
                        <a target="_blank" rel="noreferrer" id="project-link">
                            link para jornada
                        </a>
                    </span>
                </div>
                <div className="row input-group mb-2" id="mode-chooser">
                    <span className="col-3 input-group-text">modo de visualização</span>
                    <select className="col-9 form-select" aria-label="Default select example" id="modes-list" />
                </div>
                <div className="row input-group mb-2">
                    <div className="d-flex justify-content-end">
                        <div>
                            <button type="button" className="btn btn-secondary btn-sm me-2" id="save_svg_button">
                                svg
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" id="save_json_button">
                                json
                            </button>
                        </div>
                    </div>
                </div>
                <div className="row mb-2">
                    <label htmlFor="time_ticks" className="form-label col-md-5" id="choose_date">
                        filtrar itens por data:
                    </label>
                    <input
                        id="time_ticks"
                        type="range"
                        className="form-range col-md-7"
                        min="0"
                        max="50"
                        step="0.1"
                        defaultValue="50"
                    />
                </div>
                <div id="loading-spinner">
                    <div className="d-flex justify-content-center mt-3">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center mt-2">
                        <div className="progress w-50">
                            <div
                                id="alpha_value"
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: '0%' }}
                                aria-valuenow="0"
                                aria-valuemin="0"
                                aria-valuemax="100"
                            />
                        </div>
                    </div>
                    <div className="d-flex justify-content-center mt-2">
                        <p id="loading-message">Calculating network layout...</p>
                    </div>
                </div>
                <div className="row mt-3" id="statistics">
                    <ul id="stat_list" />
                    <div id="indicators" style={{ display: 'none' }}>
                        pessoas <span id="pessoas_num" />
                        <br />
                        pessoas inativas <span id="pessoas_inativas_num" />
                        <br />
                        <strong>
                            índice de pessoas ativas na jornada
                            <span style={{ color: '#EE6E5F', fontSize: 'x-large' }} id="indice_atividade_num" />
                        </strong>
                        <br />
                        <br />
                        questões <span id="questoes_num" />
                        <br />
                        respostas <span id="respostas_num" /> de <span id="respostas_potenciais_num" /> esperadas
                        <br />
                        <strong>
                            índice de engajamento nas questões
                            <span style={{ color: '#32CCB0', fontSize: 'x-large' }} id="engajamento_questoes_num" />
                        </strong>
                        <br />
                        <br />
                        comentários <span id="comentarios_num" />
                        <br />
                        concordar <span id="concordar_num" />
                        <br />
                        interações <span id="interacoes_num" /> de <span id="interacoes_potenciais_num" /> esperadas
                        <br />
                        <strong>
                            índice de engajamento nos debates
                            <span style={{ color: '#2D97DE', fontSize: 'x-large' }} id="engajamento_interacoes_num" />
                        </strong>
                        <br />
                        <br />
                        <strong>índice de engajamento nas divergências</strong>
                        <br />
                        <h1 style={{ color: '#825DED', fontWeight: 700 }} id="engajamento_media_num" />
                    </div>
                </div>
                <div className="row" id="graph-view" style={{ display: 'none' }}>
                    <svg id="main_svg" />
                    <a id="downloadAnchorElem" style={{ display: 'none' }} />
                    <a id="link_svg" style={{ display: 'none' }} />
                </div>
                <div id="legend-container" />
                <div className="row" id="beeswarm-view" style={{ display: 'none' }}>
                    <svg id="beeswarm_svg" />
                    <a id="downloadAnchorElem_beeswarm" style={{ display: 'none' }} />
                    <a id="link_svg_beeswarm" style={{ display: 'none' }} />
                </div>
                <div className="row input-group mb-3">
                    <select className="col form-select" id="intervals" />
                    <button type="button" className="col btn" id="periodic-check-button">
                        inicializando...
                    </button>
                </div>
                <div className="row mb-3">
                    <p className="col" id="periodic-check-status" />
                </div>
            </div>
        </div>
    );
}

export default MainPage;

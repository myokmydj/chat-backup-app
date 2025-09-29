// File: src/components/DataImportModal.js

import React, { useState, useRef, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import * as XLSX from 'xlsx';

const DataImportModal = ({ isOpen, onClose, onImport, characters }) => {
  const [sourceType, setSourceType] = useState('txt');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  // ▼▼▼ NEW: 선택된 버전을 관리할 상태 추가 ▼▼▼
  const [selectedVersions, setSelectedVersions] = useState({ me: null, other: null });

  const characterNameMap = {
    me: characters?.me?.[0]?.name || 'A 캐릭터',
    other: characters?.other?.[0]?.name || 'B 캐릭터',
  };
  
  // ▼▼▼ NEW: 모달이 열리거나 캐릭터 정보가 바뀔 때 선택된 버전을 초기화 ▼▼▼
  useEffect(() => {
    if (isOpen && characters) {
      setSelectedVersions({
        me: characters.me?.[0]?.id || null,
        other: characters.other?.[0]?.id || null,
      });
    }
  }, [isOpen, characters]);

  const handleVersionChange = (key, versionId) => {
    setSelectedVersions(prev => ({ ...prev, [key]: versionId }));
  };

  const resetState = () => {
    setGoogleSheetUrl('');
    setIsLoading(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };
  
  const createMessageObjects = (parsedData) => {
    if (!parsedData || parsedData.length === 0) {
      throw new Error("파싱된 데이터가 없습니다.");
    }

    return parsedData.map(item => {
      const speakerName = (item.speaker || '').trim();
      const content = (item.content || '').trim();

      if (!content) return null;

      let sender, characterVersionId;
      if (speakerName === characterNameMap.me) {
        sender = 'Me';
        // ▼▼▼ NEW: 상태에서 선택된 버전 ID 사용 ▼▼▼
        characterVersionId = selectedVersions.me;
      } else if (speakerName === characterNameMap.other) {
        sender = 'Other';
        // ▼▼▼ NEW: 상태에서 선택된 버전 ID 사용 ▼▼▼
        characterVersionId = selectedVersions.other;
      } else {
        sender = 'Other';
        characterVersionId = selectedVersions.other;
      }

      return {
        type: 'text',
        sender,
        content,
        characterVersionId,
      };
    }).filter(Boolean);
  };

  const parseTxtFile = (content) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const regex = /^\[(.+?)\]\s*(.*)$/;
    return lines.map(line => {
      const match = line.match(regex);
      if (match) {
        return { speaker: match[1].trim(), content: match[2].trim() };
      }
      return null;
    }).filter(Boolean);
  };
  
  const parseExcelFile = (data) => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['speaker', 'content'], range: 1 });
    return jsonData;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        let parsedData;
        if (file.name.endsWith('.txt')) {
          parsedData = parseTxtFile(event.target.result);
        } else if (file.name.endsWith('.xlsx')) {
          parsedData = parseExcelFile(event.target.result);
        } else {
          throw new Error('지원하지 않는 파일 형식입니다. (.txt 또는 .xlsx)');
        }
        
        const finalMessages = createMessageObjects(parsedData);
        onImport(finalMessages);
      } catch (err) {
        setError(`파일 처리 중 오류 발생: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
        setError('파일을 읽는 데 실패했습니다.');
        setIsLoading(false);
    }

    if (file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
      reader.readAsArrayBuffer(file);
    }
  };
  
  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) {
      setError('Google Sheets URL을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const idRegex = /\/d\/([a-zA-Z0-9-_]+)/;
      const gidRegex = /[#&]gid=([0-9]+)/;
      const idMatch = googleSheetUrl.match(idRegex);

      if (!idMatch || !idMatch[1]) {
        throw new Error("유효한 Google Sheets URL이 아닙니다. URL에 '/d/...' 부분이 포함되어 있는지 확인하세요.");
      }
      const sheetId = idMatch[1];
      const gidMatch = googleSheetUrl.match(gidRegex);
      const gid = gidMatch && gidMatch[1] ? gidMatch[1] : '0';

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      const csvText = await window.electronAPI.fetchGoogleSheet(csvUrl);

      if (!csvText) {
          throw new Error("Google Sheets에서 데이터를 받아오지 못했습니다. 비어있는 시트가 아닌지 확인해주세요.");
      }
      
      const lines = csvText.trim().split('\n').slice(1);
      const parsedData = lines.map(line => {
        const columns = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"' && (current === '' || current.slice(-1) !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        columns.push(current);

        return {
          speaker: (columns[0] || '').trim().replace(/^"|"$/g, '').replace(/\r$/, ''),
          content: (columns[1] || '').trim().replace(/^"|"$/g, '').replace(/\r$/, '')
        };
      }).filter(item => item.speaker && item.content);
      
      const finalMessages = createMessageObjects(parsedData);
      onImport(finalMessages);

    } catch (err) {
      setError(`Google Sheets 처리 중 오류 발생: ${err.message}. 시트가 '링크가 있는 모든 사용자'에게 공개되어 있는지 확인하세요.`);
      setIsLoading(false);
    }
  };
  
  const renderImportOptions = () => (
    <>
      <p className="import-instruction">
        파일의 화자 이름(`{characterNameMap.me}`, `{characterNameMap.other}`)을 아래 캐릭터에 매칭합니다. <br/>
        각 캐릭터에 적용할 프로필 버전을 선택해주세요.
      </p>
      <div className="import-character-version-selectors">
        <div className="form-group">
            <label>{characterNameMap.me}</label>
            <select value={selectedVersions.me || ''} onChange={(e) => handleVersionChange('me', e.target.value)} disabled={!characters.me || characters.me.length === 0}>
                {(characters.me || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
        </div>
        <div className="form-group">
            <label>{characterNameMap.other}</label>
            <select value={selectedVersions.other || ''} onChange={(e) => handleVersionChange('other', e.target.value)} disabled={!characters.other || characters.other.length === 0}>
                {(characters.other || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
        </div>
      </div>
    </>
  );

  return (
    <>
      <SettingsModal isOpen={isOpen} onClose={handleClose} title="데이터 불러오기">
        <div className="data-import-modal utility-panel">
          <div className="import-source-tabs">
            <button className={sourceType === 'txt' ? 'active' : ''} onClick={() => setSourceType('txt')}>TXT 파일</button>
            <button className={sourceType === 'excel' ? 'active' : ''} onClick={() => setSourceType('excel')}>Excel 파일</button>
            <button className={sourceType === 'google' ? 'active' : ''} onClick={() => setSourceType('google')}>Google Sheets</button>
          </div>

          {sourceType === 'txt' && (
            <div className="import-content form-card">
              {renderImportOptions()}
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
                TXT 파일 선택...
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt" onChange={handleFileChange} />
            </div>
          )}

          {sourceType === 'excel' && (
            <div className="import-content form-card">
              {renderImportOptions()}
              <p className="import-instruction" style={{marginTop: '1rem'}}>
                A열은 화자, B열은 내용으로 구성된 Excel 파일을 선택하세요.
              </p>
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
                Excel 파일 선택...
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx" onChange={handleFileChange} />
            </div>
          )}
          
          {sourceType === 'google' && (
            <div className="import-content form-card">
              {renderImportOptions()}
              <p className="import-instruction" style={{marginTop: '1rem'}}>
                1. Google 스프레드시트 우상단 **[공유]** 버튼 클릭<br/>
                2. 일반 액세스 설정을 **'링크가 있는 모든 사용자'**로 변경<br/>
                3. **[링크 복사]**를 눌러 나온 주소를 아래에 붙여넣으세요.
              </p>
              <input
                type="text"
                placeholder="Google Sheets 공유 링크"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                disabled={isLoading}
              />
              <button className="btn-primary" onClick={handleGoogleSheetImport} disabled={isLoading}>
                불러오기
              </button>
            </div>
          )}

          {isLoading && <div className="import-status">데이터를 불러오는 중...</div>}
          {error && <div className="import-status error">{error}</div>}
        </div>
      </SettingsModal>
    </>
  );
};

export default DataImportModal;
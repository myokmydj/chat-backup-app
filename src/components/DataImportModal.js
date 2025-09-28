// File: src/components/DataImportModal.js

import React, { useState, useRef } from 'react';
import SettingsModal from './SettingsModal';
import * as XLSX from 'xlsx';

const DataImportModal = ({ isOpen, onClose, onImport, characters }) => {
  const [sourceType, setSourceType] = useState('txt');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const characterNameMap = {
    me: characters?.me?.[0]?.name || 'A 캐릭터',
    other: characters?.other?.[0]?.name || 'B 캐릭터',
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

      let sender, characterKey;
      if (speakerName === characterNameMap.me) {
        sender = 'Me';
        characterKey = 'me';
      } else if (speakerName === characterNameMap.other) {
        sender = 'Other';
        characterKey = 'other';
      } else {
        sender = 'Other';
        characterKey = 'other';
      }

      const versions = characters[characterKey] || [];
      const characterVersionId = versions.length > 0 ? versions[0].id : null;

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

  return (
    <>
      <SettingsModal isOpen={isOpen} onClose={handleClose} title="데이터 불러오기">
        <div className="data-import-modal utility-panel">
          <div className="import-source-tabs">
            <button className={sourceType === 'txt' ? 'active' : ''} onClick={() => setSourceType('txt')}>TXT 파일</button>
            <button className={sourceType === 'excel' ? 'active' : ''} onClick={() => setSourceType('excel')}>Excel 파일</button>
            <button className={sourceType === 'google' ? 'active' : ''} onClick={() => setSourceType('google')}>Google Sheets</button>
            {/* [제거 완료] 트위터 탭 버튼이 삭제되었습니다. */}
          </div>

          {sourceType === 'txt' && (
            <div className="import-content form-card">
              <p className="import-instruction">
                `[화자명] 내용` 형식의 텍스트 파일을 선택하세요.<br/>
                예: `[{characterNameMap.me}] 안녕하세요.`
              </p>
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
                TXT 파일 선택...
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt" onChange={handleFileChange} />
            </div>
          )}

          {sourceType === 'excel' && (
            <div className="import-content form-card">
              <p className="import-instruction">
                첫 번째 행은 헤더(제목)입니다. A열에는 화자 이름, B열에는 내용이 있는 Excel(.xlsx) 파일을 선택하세요.
              </p>
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
                Excel 파일 선택...
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx" onChange={handleFileChange} />
            </div>
          )}
          
          {sourceType === 'google' && (
            <div className="import-content form-card">
              <p className="import-instruction">
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

          {/* [제거 완료] 트위터 관련 UI가 모두 삭제되었습니다. */}

          {isLoading && <div className="import-status">데이터를 불러오는 중...</div>}
          {error && <div className="import-status error">{error}</div>}
        </div>
      </SettingsModal>
    </>
  );
};

export default DataImportModal;
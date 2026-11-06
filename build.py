#!/usr/bin/env python3
"""Gera o site somente-leitura do painel comercial da Alô Imóveis.

Uso: python3 -I build.py DB_DIR SYNC_DIR
  DB_DIR   pasta com <coleção>/<id>.json exportados do banco do painel
           (corretores, metas, estatisticas, reunioes, distribuicao)
  SYNC_DIR pasta com sync_crm.json e sync_hoje.json gerados pelo sync_jet.py

Escreve index.html (a partir de template/painel.html) e data.json na raiz.
Telefones, e-mails e demais dados de contato ficam de fora.
"""
import json, os, sys, glob, re

ROOT = os.path.dirname(os.path.abspath(__file__))
REMOVER = {'telefone', 'phone', 'phones', 'email', 'emails', 'para', 'cc', 'ccExtra', 'enviadoPara', 'nomeCRM'}

def limpar(x):
    if isinstance(x, dict):
        return {k: limpar(v) for k, v in x.items() if k not in REMOVER}
    if isinstance(x, list):
        return [limpar(v) for v in x]
    if isinstance(x, str) and re.search(r'\+?\d[\d\s().-]{9,}\d', x):
        return re.sub(r'\+?\d[\d\s().-]{9,}\d', '[oculto]', x)
    return x

def main(db_dir, sync_dir):
    data = {}
    for col in ('corretores', 'metas', 'estatisticas', 'reunioes', 'distribuicao'):
        data[col] = {}
        for p in glob.glob(os.path.join(db_dir, col, '*.json')):
            data[col][os.path.basename(p)[:-5]] = json.load(open(p))
    def sync_file(k):
        for name in ('sync_%s.json' % k, '%s.json' % k):
            p = os.path.join(sync_dir, name)
            if os.path.exists(p): return json.load(open(p))
        return None
    data['sync'] = {k: sync_file(k) for k in ('crm', 'hoje', 'analise')}
    data = limpar(data)
    json.dump(data, open(os.path.join(ROOT, 'data.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

    page = open(os.path.join(ROOT, 'template', 'painel.html')).read()
    page = page.replace('<title>Reuniões Comerciais Alô</title>', '<title>Painel de acompanhamento</title>')
    page = page.replace('registro, envio e evolução da equipe', 'Alô Imóveis Curitiba').replace('Alô Imóveis Curitiba · Alô Imóveis Curitiba', 'Alô Imóveis Curitiba')
    page = page.replace('<h1>Reuniões <span>Comerciais</span></h1>', '<h1>Painel de <span>acompanhamento</span></h1>')
    head = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<meta name="robots" content="noindex,nofollow">'
            '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}'
            '#tab-btn-reuniao,#tab-btn-corretores,#btn-sync,#sync-msg,#banner{display:none!important}</style>'
            '<script>' + open(os.path.join(ROOT, 'template', 'loader.js')).read() + '</script></head><body>')
    open(os.path.join(ROOT, 'index.html'), 'w').write(head + page + '</body></html>')
    print('ok', {k: len(v) for k, v in data.items()})

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

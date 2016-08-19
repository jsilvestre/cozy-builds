helpers = require './helpers'
should = require('chai').Should()
xmldoc = require 'xmldoc'
Contact = require "#{helpers.prefix}server/models/contact"

describe 'Carddav support - Apple', ->

    before helpers.createRequests
    before helpers.cleanDB
    before helpers.makeDAVAccount
    before helpers.startServer
    before helpers.createContact 'Bob'
    before helpers.createContact 'Steve'
    before ->
        url = '/public/sync/addressbooks/me/all-contacts/'
        @bobHref   = url + @contacts['Bob'].id   + '.vcf'
        @steveHref = url + @contacts['Steve'].id + '.vcf'

    after  helpers.closeServer
    after  helpers.cleanDB

    ### Not tested because part of jsDAV
       OPTIONS /public/sync/addressbooks/me/all-contacts/
       PROPFIND /public/sync/addressbooks/me/all-contacts/ DEPTH=0
    ###


    describe 'Apple PROPFIND /public/sync/addressbooks/me/all-contacts/ D=1', ->

        url = '/public/addressbooks/me/all-contacts/'
        before helpers.send 'PROPFIND', url, """
            <?xml version="1.0" encoding="utf-8" ?>
            <A:propfind xmlns:A="DAV:">
                <A:prop>
                    <A:getetag/>
                </A:prop>
            </A:propfind>
        """, depth: 1

        it 'contains a ref to each Contacts', ->

            body = new xmldoc.XmlDocument @resbody
            responses = body.childrenNamed 'd:response'
            responses.length.should.equal 3
            hrefs = responses.map (res) -> res.childNamed('d:href').val

            hrefs.should.include @bobHref
            hrefs.should.include @steveHref


    describe "Apple Create contact", ->

        url = '/public/addressbooks/me/all-contacts/300C1951-1585-49C9-AD22-661DBCCA89F4.vcf'
        before helpers.send 'PUT', url, """
            BEGIN:VCARD
            VERSION:3.0
            FN:Steve
            EMAIL;TYPE=INTERNET;TYPE=HOME:stw@test.com
            N:Wonder;;;;
            TEL;TYPE=CELL:+33 1 23 45 67 89
            PRODID:-//dmfs.org//mimedir.vcard//EN
            REV:20131011T070908Z
            UID:24edbec3-a2db-4b07-97d1-3609d526f4c8
            END:VCARD
        """,
            'If-None-Match': '*'
            'Content-Type': 'text/vcard; charset=utf-8'

        it "should work", ->
            @res.statusCode.should.equal 201
            @resbody.should.have.length 0

        created = null
        it "and contact has been created in db", (done) ->
            Contact.byURI '300C1951-1585-49C9-AD22-661DBCCA89F4.vcf', (err, contacts) ->
                should.not.exist err
                created = contacts[0]
                created.should.have.property 'carddavuri'
                done()

        it "and contact's vcf should include the UID property", (done) ->
            created.toVCF (err, vCardOutput) ->
                vCardOutput.indexOf('UID').should.not.equal -1
                done()
